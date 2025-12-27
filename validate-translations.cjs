#!/usr/bin/env node
/**
 * Translation Validation Tool
 * Validates existing translations for completeness and consistency
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['es', 'fr', 'de', 'it', 'pl', 'pt'];

class TranslationValidator {
  constructor() {
    this.results = {
      languages: {},
      errors: [],
      warnings: [],
      summary: {
        totalLanguages: 0,
        totalNamespaces: 0,
        totalKeys: 0,
        totalErrors: 0,
        totalWarnings: 0
      }
    };
  }

  /**
   * Load all translations for a language
   */
  loadLanguage(lang) {
    const langPath = path.join(LOCALES_DIR, lang);
    const translations = {};

    if (!fs.existsSync(langPath)) {
      return null;
    }

    const namespaces = fs.readdirSync(langPath);

    namespaces.forEach(namespace => {
      const filePath = path.join(langPath, namespace, 'translations.json');
      if (fs.existsSync(filePath)) {
        try {
          translations[namespace] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
          this.addError(lang, namespace, 'parse_error', null, `Failed to parse JSON: ${error.message}`);
        }
      }
    });

    return translations;
  }

  /**
   * Get all keys from nested object
   */
  getAllKeys(obj, prefix = '') {
    const keys = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(keys, this.getAllKeys(value, fullKey));
      } else if (typeof value === 'string') {
        keys[fullKey] = value;
      }
    }

    return keys;
  }

  /**
   * Add error to results
   */
  addError(language, namespace, type, key, message) {
    this.results.errors.push({
      language,
      namespace,
      type,
      key,
      message,
      severity: 'error'
    });
  }

  /**
   * Add warning to results
   */
  addWarning(language, namespace, type, key, message) {
    this.results.warnings.push({
      language,
      namespace,
      type,
      key,
      message,
      severity: 'warning'
    });
  }

  /**
   * Validate translation completeness
   */
  validateCompleteness(sourceKeys, targetKeys, language, namespace) {
    const sourceKeyList = Object.keys(sourceKeys);
    const targetKeyList = Object.keys(targetKeys);

    // Check for missing keys
    sourceKeyList.forEach(key => {
      if (!targetKeyList.includes(key)) {
        this.addError(
          language,
          namespace,
          'missing_key',
          key,
          `Missing translation for key: ${key}`
        );
      }
    });

    // Check for extra keys
    targetKeyList.forEach(key => {
      if (!sourceKeyList.includes(key)) {
        this.addWarning(
          language,
          namespace,
          'extra_key',
          key,
          `Extra key not found in source: ${key}`
        );
      }
    });

    return {
      total: sourceKeyList.length,
      translated: targetKeyList.filter(k => sourceKeyList.includes(k)).length,
      missing: sourceKeyList.filter(k => !targetKeyList.includes(k)).length,
      extra: targetKeyList.filter(k => !sourceKeyList.includes(k)).length
    };
  }

  /**
   * Validate translation quality
   */
  validateQuality(sourceKeys, targetKeys, language, namespace) {
    const issues = {
      empty: 0,
      untranslated: 0,
      interpolationMismatch: 0,
      tooLong: 0
    };

    Object.entries(sourceKeys).forEach(([key, sourceValue]) => {
      const targetValue = targetKeys[key];

      if (!targetValue) return;

      // Check for empty values
      if (targetValue.trim() === '') {
        issues.empty++;
        this.addError(
          language,
          namespace,
          'empty_value',
          key,
          'Translation is empty'
        );
      }

      // Check if possibly untranslated (same as source)
      if (targetValue === sourceValue && language !== SOURCE_LANG) {
        // Allow certain common terms that might be the same
        const allowedSame = ['OK', 'Email', 'kg', 'lbs', 'min', 'cal', 'bpm'];
        const isAllowed = allowedSame.some(term =>
          sourceValue.toLowerCase().includes(term.toLowerCase())
        );

        if (!isAllowed && sourceValue.split(' ').length > 1) {
          issues.untranslated++;
          this.addWarning(
            language,
            namespace,
            'possibly_untranslated',
            key,
            `Same as source: "${sourceValue}"`
          );
        }
      }

      // Check interpolation variables
      const sourceVars = (sourceValue.match(/\{\{[^}]+\}\}/g) || []).sort();
      const targetVars = (targetValue.match(/\{\{[^}]+\}\}/g) || []).sort();

      if (JSON.stringify(sourceVars) !== JSON.stringify(targetVars)) {
        issues.interpolationMismatch++;
        this.addError(
          language,
          namespace,
          'interpolation_mismatch',
          key,
          `Variables don't match. Source: [${sourceVars.join(', ')}], Target: [${targetVars.join(', ')}]`
        );
      }

      // Check if translation is significantly longer (might not fit in UI)
      const lengthRatio = targetValue.length / sourceValue.length;
      if (lengthRatio > 1.5 && sourceValue.length > 20) {
        issues.tooLong++;
        this.addWarning(
          language,
          namespace,
          'significantly_longer',
          key,
          `Translation is ${Math.round((lengthRatio - 1) * 100)}% longer than source (may not fit in UI)`
        );
      }
    });

    return issues;
  }

  /**
   * Validate a single language
   */
  validateLanguage(language, sourceTranslations) {
    const targetTranslations = this.loadLanguage(language);

    if (!targetTranslations) {
      this.addError(language, null, 'missing_language', null, `Language directory not found: ${language}`);
      return;
    }

    const languageResults = {
      namespaces: {},
      totals: {
        keys: 0,
        translated: 0,
        missing: 0,
        errors: 0,
        warnings: 0
      }
    };

    // Validate each namespace
    Object.entries(sourceTranslations).forEach(([namespace, sourceContent]) => {
      const targetContent = targetTranslations[namespace];

      if (!targetContent) {
        this.addError(language, namespace, 'missing_namespace', null, `Namespace not found: ${namespace}`);
        return;
      }

      const sourceKeys = this.getAllKeys(sourceContent);
      const targetKeys = this.getAllKeys(targetContent);

      // Validate completeness
      const completeness = this.validateCompleteness(sourceKeys, targetKeys, language, namespace);

      // Validate quality
      const quality = this.validateQuality(sourceKeys, targetKeys, language, namespace);

      languageResults.namespaces[namespace] = {
        completeness,
        quality,
        coverage: completeness.total > 0
          ? Math.round((completeness.translated / completeness.total) * 100)
          : 0
      };

      languageResults.totals.keys += completeness.total;
      languageResults.totals.translated += completeness.translated;
      languageResults.totals.missing += completeness.missing;
    });

    // Count errors and warnings for this language
    languageResults.totals.errors = this.results.errors.filter(e => e.language === language).length;
    languageResults.totals.warnings = this.results.warnings.filter(w => w.language === language).length;

    languageResults.totalCoverage = languageResults.totals.keys > 0
      ? Math.round((languageResults.totals.translated / languageResults.totals.keys) * 100)
      : 0;

    this.results.languages[language] = languageResults;
  }

  /**
   * Run validation
   */
  validate() {
    console.log('Translation Validation');
    console.log('='.repeat(60));
    console.log('');

    // Load source translations
    console.log('Loading source translations (English)...');
    const sourceTranslations = this.loadLanguage(SOURCE_LANG);

    if (!sourceTranslations || Object.keys(sourceTranslations).length === 0) {
      console.error('Error: No source translations found');
      return;
    }

    const sourceKeys = Object.values(sourceTranslations).reduce((total, ns) => {
      return total + Object.keys(this.getAllKeys(ns)).length;
    }, 0);

    console.log(`✓ Loaded ${Object.keys(sourceTranslations).length} namespaces with ${sourceKeys} keys\n`);

    // Validate each target language
    TARGET_LANGS.forEach(lang => {
      console.log(`Validating ${lang.toUpperCase()}...`);
      this.validateLanguage(lang, sourceTranslations);
    });

    // Update summary
    this.results.summary.totalLanguages = TARGET_LANGS.length;
    this.results.summary.totalNamespaces = Object.keys(sourceTranslations).length;
    this.results.summary.totalKeys = sourceKeys;
    this.results.summary.totalErrors = this.results.errors.length;
    this.results.summary.totalWarnings = this.results.warnings.length;

    this.printResults();
    this.saveResults();
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(60));

    // Overall summary
    console.log('\nOverall Summary:');
    console.log(`  Languages: ${this.results.summary.totalLanguages}`);
    console.log(`  Total Keys: ${this.results.summary.totalKeys}`);
    console.log(`  Total Errors: ${this.results.summary.totalErrors}`);
    console.log(`  Total Warnings: ${this.results.summary.totalWarnings}`);

    // Language breakdown
    console.log('\nLanguage Coverage:');
    console.log('┌─────────┬──────────┬────────────┬─────────┬──────────┬──────────┐');
    console.log('│ Language│  Coverage│  Translated│  Missing│   Errors │ Warnings │');
    console.log('├─────────┼──────────┼────────────┼─────────┼──────────┼──────────┤');

    TARGET_LANGS.forEach(lang => {
      const results = this.results.languages[lang];
      if (results) {
        const coverage = results.totalCoverage.toString().padEnd(3);
        const translated = results.totals.translated.toString().padStart(4);
        const missing = results.totals.missing.toString().padStart(4);
        const errors = results.totals.errors.toString().padStart(4);
        const warnings = results.totals.warnings.toString().padStart(4);

        console.log(`│   ${lang.toUpperCase()}   │    ${coverage}%  │       ${translated} │    ${missing} │     ${errors} │     ${warnings} │`);
      }
    });

    console.log('└─────────┴──────────┴────────────┴─────────┴──────────┴──────────┘');

    // Critical errors
    if (this.results.summary.totalErrors > 0) {
      console.log('\n⚠ CRITICAL ERRORS:');

      const errorsByType = {};
      this.results.errors.forEach(error => {
        const key = `${error.type}`;
        errorsByType[key] = (errorsByType[key] || 0) + 1;
      });

      Object.entries(errorsByType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

      console.log('\nFirst 10 errors:');
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`  [${error.language}/${error.namespace}] ${error.key}: ${error.message}`);
      });

      if (this.results.errors.length > 10) {
        console.log(`  ... and ${this.results.errors.length - 10} more errors`);
      }
    }

    // Warnings summary
    if (this.results.summary.totalWarnings > 0) {
      console.log(`\n⚠ ${this.results.summary.totalWarnings} warnings found (see full report for details)`);
    }

    // Status
    console.log('\n' + '='.repeat(60));
    if (this.results.summary.totalErrors === 0) {
      console.log('✓ VALIDATION PASSED - No critical errors');
    } else {
      console.log('✗ VALIDATION FAILED - Critical errors found');
    }
    console.log('='.repeat(60));
  }

  /**
   * Save results to file
   */
  saveResults() {
    const reportPath = path.join(__dirname, 'translation-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`\nFull report saved to: ${reportPath}`);

    // Also create human-readable markdown
    this.saveMarkdownReport();
  }

  /**
   * Save markdown report
   */
  saveMarkdownReport() {
    let markdown = `# Translation Validation Report

Generated: ${new Date().toISOString()}

## Summary

- **Languages:** ${this.results.summary.totalLanguages}
- **Total Keys:** ${this.results.summary.totalKeys}
- **Total Errors:** ${this.results.summary.totalErrors}
- **Total Warnings:** ${this.results.summary.totalWarnings}

## Coverage by Language

| Language | Coverage | Translated | Missing | Errors | Warnings |
|----------|----------|------------|---------|--------|----------|
`;

    TARGET_LANGS.forEach(lang => {
      const results = this.results.languages[lang];
      if (results) {
        markdown += `| ${lang.toUpperCase()} | ${results.totalCoverage}% | ${results.totals.translated} | ${results.totals.missing} | ${results.totals.errors} | ${results.totals.warnings} |\n`;
      }
    });

    markdown += '\n## Namespace Details\n\n';

    TARGET_LANGS.forEach(lang => {
      const results = this.results.languages[lang];
      if (results) {
        markdown += `### ${lang.toUpperCase()}\n\n`;
        markdown += '| Namespace | Coverage | Translated | Missing | Issues |\n';
        markdown += '|-----------|----------|------------|---------|--------|\n';

        Object.entries(results.namespaces).forEach(([ns, data]) => {
          const issues = data.quality.empty + data.quality.untranslated + data.quality.interpolationMismatch;
          markdown += `| ${ns} | ${data.coverage}% | ${data.completeness.translated} | ${data.completeness.missing} | ${issues} |\n`;
        });

        markdown += '\n';
      }
    });

    if (this.results.errors.length > 0) {
      markdown += '## Critical Errors\n\n';

      this.results.errors.forEach(error => {
        markdown += `- **[${error.language}/${error.namespace}]** \`${error.key || 'N/A'}\`: ${error.message}\n`;
      });
    }

    if (this.results.warnings.length > 0 && this.results.warnings.length <= 50) {
      markdown += '\n## Warnings\n\n';

      this.results.warnings.forEach(warning => {
        markdown += `- **[${warning.language}/${warning.namespace}]** \`${warning.key || 'N/A'}\`: ${warning.message}\n`;
      });
    } else if (this.results.warnings.length > 50) {
      markdown += `\n## Warnings\n\n${this.results.warnings.length} warnings found. See JSON report for full list.\n`;
    }

    const mdPath = path.join(__dirname, 'TRANSLATION_VALIDATION_REPORT.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`Markdown report saved to: ${mdPath}`);
  }
}

// Run validation
const validator = new TranslationValidator();
validator.validate();

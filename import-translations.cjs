#!/usr/bin/env node
/**
 * Translation Import Tool
 * Imports translated files and validates completeness
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const IMPORT_DIR = path.join(__dirname, 'translation-import');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['es', 'fr', 'de', 'it', 'pl', 'pt'];

// Validation results
const validation = {
  errors: [],
  warnings: [],
  stats: {}
};

/**
 * Load source (English) translations
 */
function loadSourceTranslations() {
  const source = {};
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LANG);

  fs.readdirSync(sourcePath).forEach(namespace => {
    const filePath = path.join(sourcePath, namespace, 'translations.json');
    if (fs.existsSync(filePath)) {
      source[namespace] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  });

  return source;
}

/**
 * Get all translation keys from an object (flattened)
 */
function flattenKeys(obj, prefix = '') {
  let keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(flattenKeys(value, fullKey));
    } else if (typeof value === 'string') {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Validate translation completeness
 */
function validateTranslation(sourceObj, translatedObj, language, namespace) {
  const sourceKeys = flattenKeys(sourceObj);
  const translatedKeys = flattenKeys(translatedObj);

  const stats = {
    language,
    namespace,
    sourceKeys: sourceKeys.length,
    translatedKeys: translatedKeys.length,
    missingKeys: [],
    extraKeys: [],
    emptyValues: [],
    untranslatedValues: [],
    interpolationMismatches: []
  };

  // Check for missing keys
  sourceKeys.forEach(key => {
    if (!translatedKeys.includes(key)) {
      stats.missingKeys.push(key);
      validation.errors.push({
        language,
        namespace,
        type: 'missing_key',
        key,
        message: `Missing translation for key: ${key}`
      });
    }
  });

  // Check for extra keys
  translatedKeys.forEach(key => {
    if (!sourceKeys.includes(key)) {
      stats.extraKeys.push(key);
      validation.warnings.push({
        language,
        namespace,
        type: 'extra_key',
        key,
        message: `Extra key not in source: ${key}`
      });
    }
  });

  // Check for empty or untranslated values
  sourceKeys.forEach(key => {
    const sourceValue = getNestedValue(sourceObj, key);
    const translatedValue = getNestedValue(translatedObj, key);

    if (translatedValue === '') {
      stats.emptyValues.push(key);
      validation.errors.push({
        language,
        namespace,
        type: 'empty_value',
        key,
        message: `Empty translation for key: ${key}`
      });
    } else if (translatedValue === sourceValue && language !== SOURCE_LANG) {
      stats.untranslatedValues.push(key);
      validation.warnings.push({
        language,
        namespace,
        type: 'untranslated',
        key,
        message: `Possibly untranslated (same as English): ${key}`
      });
    }

    // Check interpolation variables match
    if (sourceValue && translatedValue) {
      const sourceVars = (sourceValue.match(/\{\{[^}]+\}\}/g) || []).sort();
      const translatedVars = (translatedValue.match(/\{\{[^}]+\}\}/g) || []).sort();

      if (JSON.stringify(sourceVars) !== JSON.stringify(translatedVars)) {
        stats.interpolationMismatches.push({
          key,
          source: sourceVars,
          translated: translatedVars
        });
        validation.errors.push({
          language,
          namespace,
          type: 'interpolation_mismatch',
          key,
          message: `Interpolation variables don't match. Source: ${sourceVars.join(', ')}, Translated: ${translatedVars.join(', ')}`
        });
      }
    }
  });

  return stats;
}

/**
 * Import translations from CSV
 */
function importFromCSV(csvPath) {
  console.log(`Importing from CSV: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  // Expected headers: Namespace, Key, English Text, Spanish, French, German, Italian, Polish, Portuguese
  const namespaceIdx = headers.indexOf('Namespace');
  const keyIdx = headers.indexOf('Key');
  const langIndices = {};

  TARGET_LANGS.forEach(lang => {
    const langName = {
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pl: 'Polish',
      pt: 'Portuguese'
    }[lang];

    const idx = headers.indexOf(langName);
    if (idx !== -1) {
      langIndices[lang] = idx;
    }
  });

  // Parse CSV and build translation objects
  const translations = {};
  TARGET_LANGS.forEach(lang => {
    translations[lang] = {};
  });

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v =>
      v.replace(/^"(.*)"$/, '$1').replace(/""/g, '"')
    );

    const namespace = values[namespaceIdx];
    const key = values[keyIdx];

    if (!namespace || !key) continue;

    TARGET_LANGS.forEach(lang => {
      const idx = langIndices[lang];
      if (idx !== undefined && values[idx]) {
        if (!translations[lang][namespace]) {
          translations[lang][namespace] = {};
        }

        // Build nested object from dot notation key
        const keys = key.split('.');
        let current = translations[lang][namespace];

        for (let j = 0; j < keys.length - 1; j++) {
          if (!current[keys[j]]) {
            current[keys[j]] = {};
          }
          current = current[keys[j]];
        }

        current[keys[keys.length - 1]] = values[idx];
      }
    });
  }

  return translations;
}

/**
 * Import translations from JSON
 */
function importFromJSON(jsonPath) {
  console.log(`Importing from JSON: ${jsonPath}`);

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const translations = {};

  // Expected format:
  // {
  //   "languages": {
  //     "es": { "namespace": { "key": "value" } }
  //   }
  // }

  if (data.languages) {
    return data.languages;
  }

  // Alternative format: separate files per language
  // Just return empty object, user should provide correct format
  return translations;
}

/**
 * Write translations to locale files
 */
function writeTranslations(translations, language) {
  const langDir = path.join(LOCALES_DIR, language);

  // Create language directory if it doesn't exist
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  Object.entries(translations).forEach(([namespace, content]) => {
    const namespaceDir = path.join(langDir, namespace);

    if (!fs.existsSync(namespaceDir)) {
      fs.mkdirSync(namespaceDir, { recursive: true });
    }

    const filePath = path.join(namespaceDir, 'translations.json');
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');

    console.log(`  ✓ Written: ${language}/${namespace}/translations.json`);
  });
}

/**
 * Generate validation report
 */
function generateValidationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: validation.errors.length,
      totalWarnings: validation.warnings.length,
      languagesValidated: Object.keys(validation.stats).length
    },
    byLanguage: {},
    errors: validation.errors,
    warnings: validation.warnings
  };

  Object.entries(validation.stats).forEach(([lang, namespaces]) => {
    report.byLanguage[lang] = {
      totalNamespaces: Object.keys(namespaces).length,
      totalErrors: validation.errors.filter(e => e.language === lang).length,
      totalWarnings: validation.warnings.filter(w => w.language === lang).length,
      namespaces: namespaces
    };
  });

  return report;
}

/**
 * Main import function
 */
function importTranslations() {
  console.log('Translation Import Tool');
  console.log('='.repeat(60));

  // Check if import directory exists
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`\nError: Import directory not found: ${IMPORT_DIR}`);
    console.log('\nPlease create the directory and place your translated files:');
    console.log('- translations.csv (CSV format with all languages)');
    console.log('- OR separate JSON files per language (es.json, fr.json, etc.)');
    console.log('- OR translations.json with all languages nested');
    return;
  }

  // Load source translations for validation
  console.log('\nLoading source translations...');
  const sourceTranslations = loadSourceTranslations();
  console.log(`✓ Loaded ${Object.keys(sourceTranslations).length} namespaces from English`);

  // Check for CSV file
  const csvPath = path.join(IMPORT_DIR, 'translations.csv');
  let allTranslations = {};

  if (fs.existsSync(csvPath)) {
    console.log('\nImporting from CSV...');
    allTranslations = importFromCSV(csvPath);
  } else {
    // Check for individual language JSON files
    console.log('\nLooking for language JSON files...');

    TARGET_LANGS.forEach(lang => {
      const jsonPath = path.join(IMPORT_DIR, `${lang}.json`);
      if (fs.existsSync(jsonPath)) {
        console.log(`  Found: ${lang}.json`);
        allTranslations[lang] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }
    });

    if (Object.keys(allTranslations).length === 0) {
      // Try combined JSON file
      const combinedPath = path.join(IMPORT_DIR, 'translations.json');
      if (fs.existsSync(combinedPath)) {
        console.log('  Found: translations.json');
        allTranslations = importFromJSON(combinedPath);
      }
    }
  }

  if (Object.keys(allTranslations).length === 0) {
    console.error('\nError: No translation files found in import directory');
    console.log('\nExpected files:');
    console.log('- translations.csv');
    console.log('- OR es.json, fr.json, de.json, it.json, pl.json, pt.json');
    console.log('- OR translations.json (with nested language structure)');
    return;
  }

  // Validate and import each language
  console.log('\nValidating and importing translations...\n');

  Object.entries(allTranslations).forEach(([language, namespaces]) => {
    console.log(`Processing: ${language}`);

    if (!validation.stats[language]) {
      validation.stats[language] = {};
    }

    Object.entries(namespaces).forEach(([namespace, translations]) => {
      const sourceNs = sourceTranslations[namespace];

      if (!sourceNs) {
        validation.warnings.push({
          language,
          namespace,
          type: 'unknown_namespace',
          message: `Unknown namespace: ${namespace} (not found in source)`
        });
        return;
      }

      // Validate
      const stats = validateTranslation(sourceNs, translations, language, namespace);
      validation.stats[language][namespace] = stats;

      // Write if valid or force flag is set
      if (stats.missingKeys.length === 0 && stats.emptyValues.length === 0) {
        writeTranslations({ [namespace]: translations }, language);
      }
    });

    console.log('');
  });

  // Generate validation report
  const report = generateValidationReport();

  const reportPath = path.join(__dirname, 'translation-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nValidation Report: ${reportPath}`);
  console.log(`\nTotal Errors: ${report.summary.totalErrors}`);
  console.log(`Total Warnings: ${report.summary.totalWarnings}`);

  if (report.summary.totalErrors > 0) {
    console.log('\n⚠ ERRORS FOUND:');
    const errorsByType = {};
    validation.errors.forEach(err => {
      const key = `${err.language}/${err.namespace}`;
      if (!errorsByType[key]) {
        errorsByType[key] = { missing: 0, empty: 0, interpolation: 0 };
      }
      if (err.type === 'missing_key') errorsByType[key].missing++;
      if (err.type === 'empty_value') errorsByType[key].empty++;
      if (err.type === 'interpolation_mismatch') errorsByType[key].interpolation++;
    });

    Object.entries(errorsByType).forEach(([key, counts]) => {
      console.log(`  ${key}:`);
      if (counts.missing > 0) console.log(`    - ${counts.missing} missing keys`);
      if (counts.empty > 0) console.log(`    - ${counts.empty} empty values`);
      if (counts.interpolation > 0) console.log(`    - ${counts.interpolation} interpolation mismatches`);
    });

    console.log('\nPlease fix errors before deploying translations.');
  } else {
    console.log('\n✓ All validations passed!');
  }

  if (report.summary.totalWarnings > 0) {
    console.log(`\n⚠ ${report.summary.totalWarnings} warnings (review recommended)`);
  }

  console.log('\nTranslation files written to: src/i18n/locales/[language]/');
  console.log('');
}

// Run import
importTranslations();

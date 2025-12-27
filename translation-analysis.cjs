#!/usr/bin/env node
/**
 * Translation Analysis Tool
 * Analyzes English translation files for professional translation coordination
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales/en');
const OUTPUT_DIR = path.join(__dirname, 'translation-export');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Analysis results
const analysis = {
  totalKeys: 0,
  totalWords: 0,
  namespaces: {},
  interpolations: [],
  plurals: [],
  specialCharacters: [],
  technicalTerms: [],
  maxLength: {},
  glossary: new Set()
};

// Fitness-specific terms to track
const fitnessTerms = [
  'workout', 'exercise', 'training', 'session', 'rep', 'reps', 'set', 'sets',
  'weight', 'cardio', 'strength', 'calories', 'duration', 'rest', 'timer',
  'muscle', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core',
  'program', 'routine', 'progression', 'volume', 'personal records'
];

/**
 * Count words in a string
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Detect interpolations ({{variable}})
 */
function hasInterpolation(text) {
  return /\{\{[^}]+\}\}/.test(text);
}

/**
 * Detect plural forms
 */
function hasPlural(key) {
  return /_plural$|_one$|_other$|_zero$/.test(key);
}

/**
 * Detect special formatting
 */
function hasSpecialFormatting(text) {
  return /[🎉💪🏋️‍♀️⏱️📊]/.test(text) || /\*\*/.test(text) || /\n/.test(text);
}

/**
 * Check for fitness terminology
 */
function findFitnessTerms(text) {
  const found = [];
  const lowerText = text.toLowerCase();
  fitnessTerms.forEach(term => {
    if (lowerText.includes(term)) {
      found.push(term);
      analysis.glossary.add(term);
    }
  });
  return found;
}

/**
 * Recursively process translation object
 */
function processTranslations(obj, namespace, keyPath = '') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = keyPath ? `${keyPath}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      processTranslations(value, namespace, currentPath);
    } else if (typeof value === 'string') {
      analysis.totalKeys++;
      const wordCount = countWords(value);
      analysis.totalWords += wordCount;

      // Track namespace stats
      if (!analysis.namespaces[namespace]) {
        analysis.namespaces[namespace] = {
          keys: 0,
          words: 0,
          strings: []
        };
      }
      analysis.namespaces[namespace].keys++;
      analysis.namespaces[namespace].words += wordCount;
      analysis.namespaces[namespace].strings.push({
        key: currentPath,
        value: value,
        words: wordCount,
        length: value.length
      });

      // Track interpolations
      if (hasInterpolation(value)) {
        analysis.interpolations.push({
          namespace,
          key: currentPath,
          value
        });
      }

      // Track plurals
      if (hasPlural(currentPath)) {
        analysis.plurals.push({
          namespace,
          key: currentPath,
          value
        });
      }

      // Track special formatting
      if (hasSpecialFormatting(value)) {
        analysis.specialCharacters.push({
          namespace,
          key: currentPath,
          value
        });
      }

      // Track fitness terms
      const terms = findFitnessTerms(value);
      if (terms.length > 0) {
        analysis.technicalTerms.push({
          namespace,
          key: currentPath,
          value,
          terms
        });
      }

      // Track max length per namespace
      if (!analysis.maxLength[namespace] || value.length > analysis.maxLength[namespace].length) {
        analysis.maxLength[namespace] = {
          key: currentPath,
          value,
          length: value.length
        };
      }
    }
  }
}

/**
 * Read and process all translation files
 */
function analyzeTranslations() {
  const files = fs.readdirSync(LOCALES_DIR);

  files.forEach(file => {
    if (file !== 'translations.json') {
      const namespace = file;
      const filePath = path.join(LOCALES_DIR, file, 'translations.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        processTranslations(content, namespace);
      }
    }
  });
}

/**
 * Generate analysis report
 */
function generateReport() {
  const report = {
    summary: {
      totalNamespaces: Object.keys(analysis.namespaces).length,
      totalKeys: analysis.totalKeys,
      totalWords: analysis.totalWords,
      estimatedCharacters: analysis.totalWords * 6, // rough estimate
      averageWordsPerKey: Math.round(analysis.totalWords / analysis.totalKeys * 10) / 10
    },
    namespaceBreakdown: {},
    specialCases: {
      interpolations: analysis.interpolations.length,
      plurals: analysis.plurals.length,
      specialFormatting: analysis.specialCharacters.length,
      technicalTerms: analysis.technicalTerms.length
    },
    glossary: Array.from(analysis.glossary).sort()
  };

  // Add namespace details
  Object.entries(analysis.namespaces).forEach(([ns, data]) => {
    report.namespaceBreakdown[ns] = {
      keys: data.keys,
      words: data.words,
      percentage: Math.round((data.words / analysis.totalWords) * 100 * 10) / 10,
      longestString: analysis.maxLength[ns]
    };
  });

  return report;
}

/**
 * Export to CSV format
 */
function exportToCSV() {
  const rows = [
    ['Namespace', 'Key', 'English Text', 'Word Count', 'Character Count', 'Context', 'Notes']
  ];

  Object.entries(analysis.namespaces).forEach(([namespace, data]) => {
    data.strings.forEach(item => {
      const context = getContext(namespace, item.key);
      const notes = getNotes(item);

      rows.push([
        namespace,
        item.key,
        item.value,
        item.words,
        item.length,
        context,
        notes
      ]);
    });
  });

  const csv = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'translations-for-translation-service.csv'), csv);
  console.log('✓ CSV export created: translation-export/translations-for-translation-service.csv');
}

/**
 * Export to JSON format
 */
function exportToJSON() {
  const exportData = {
    metadata: {
      sourceLanguage: 'en',
      targetLanguages: ['es', 'fr', 'de', 'it', 'pl', 'pt'],
      exportDate: new Date().toISOString(),
      totalKeys: analysis.totalKeys,
      totalWords: analysis.totalWords
    },
    namespaces: {}
  };

  Object.entries(analysis.namespaces).forEach(([namespace, data]) => {
    exportData.namespaces[namespace] = {
      strings: data.strings.map(item => ({
        key: item.key,
        source: item.value,
        context: getContext(namespace, item.key),
        notes: getNotes(item),
        metadata: {
          hasInterpolation: hasInterpolation(item.value),
          hasPlural: hasPlural(item.key),
          hasSpecialFormatting: hasSpecialFormatting(item.value),
          wordCount: item.words,
          charCount: item.length
        }
      }))
    };
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'translations-for-translation-service.json'),
    JSON.stringify(exportData, null, 2)
  );
  console.log('✓ JSON export created: translation-export/translations-for-translation-service.json');
}

/**
 * Get context for a translation key
 */
function getContext(namespace, key) {
  const contexts = {
    auth: 'Authentication screens (login, signup, password)',
    calendar: 'Training calendar view and workout history',
    common: 'Common UI elements, buttons, labels',
    dashboard: 'Main dashboard screen',
    exercises: 'Exercise library and management',
    settings: 'App settings and preferences',
    stats: 'Statistics and progress tracking',
    training: 'Training programs and workout planning',
    workout: 'Active workout session interface'
  };

  let context = contexts[namespace] || namespace;

  // Add specific context based on key path
  if (key.includes('error')) context += ' - Error message';
  if (key.includes('button') || key.includes('action')) context += ' - Button/Action';
  if (key.includes('placeholder')) context += ' - Form placeholder';
  if (key.includes('label')) context += ' - Form label';
  if (key.includes('title')) context += ' - Screen/Section title';
  if (key.includes('modal')) context += ' - Modal dialog';

  return context;
}

/**
 * Get translation notes
 */
function getNotes(item) {
  const notes = [];

  if (hasInterpolation(item.value)) {
    const vars = item.value.match(/\{\{([^}]+)\}\}/g);
    notes.push(`Contains variables: ${vars.join(', ')} - DO NOT TRANSLATE these placeholders`);
  }

  if (hasPlural(item.key)) {
    notes.push('Plural form - adjust for target language plural rules');
  }

  if (hasSpecialFormatting(item.value)) {
    notes.push('Contains special formatting (emojis/markdown) - preserve in translation');
  }

  if (item.length > 50) {
    notes.push('Long text - ensure it fits in mobile UI');
  }

  if (item.key.includes('placeholder')) {
    notes.push('Short placeholder text - keep concise');
  }

  return notes.join(' | ');
}

/**
 * Generate translator instructions
 */
function generateInstructions() {
  const instructions = `# Translation Instructions for Fitness Center App

## Project Overview
Cross-platform fitness center mobile application (iOS, Android, Web)
Target audience: Gym members and fitness enthusiasts
Tone: Motivational, professional, encouraging

## Translation Guidelines

### 1. General Rules
- Maintain consistent fitness terminology across all translations
- Keep translations concise for mobile UI constraints
- Preserve placeholder variables exactly as they appear: {{variable}}
- Maintain the same tone and energy level as English
- Use imperative mood for action buttons (e.g., "Start Workout" not "Starting Workout")

### 2. Technical Requirements
- DO NOT translate placeholder variables in double curly braces: {{username}}, {{count}}, etc.
- Preserve special characters and emojis exactly: 🎉 💪 🏋️‍♀️
- Keep line breaks (\\n) in the same positions
- Maintain capitalization style (Title Case for headers, Sentence case for body text)
- Units of measurement: adapt to local conventions where appropriate
  - Keep "kg" for metric countries
  - Consider local preferences for date/time formats

### 3. Context-Specific Guidelines

#### Authentication (auth namespace)
- Professional, welcoming tone
- Error messages should be clear and actionable
- Keep password requirements precise

#### Workout Session (workout namespace)
- Motivational, energetic tone
- Timer and counter text must be very short
- Button labels should be clear and action-oriented

#### Statistics (stats namespace)
- Clear, data-focused language
- Chart labels should be concise
- Numerical terminology should be precise

#### Common UI (common namespace)
- Standard button labels (Save, Cancel, Delete, etc.)
- Should match platform conventions for target language
- Keep very concise

### 4. Fitness Terminology Glossary
Refer to glossary.json for standardized translations of:
- Exercise types (strength, cardio, flexibility, etc.)
- Muscle groups (chest, back, legs, etc.)
- Workout metrics (reps, sets, weight, volume, etc.)
- Training concepts (progression, personal records, etc.)

### 5. Quality Checks
Before submitting translations:
- ✓ All placeholder variables preserved
- ✓ Character length appropriate for mobile buttons/labels
- ✓ Fitness terminology consistent with glossary
- ✓ Tone matches source (motivational for workouts, clear for settings)
- ✓ Special characters and emojis preserved
- ✓ No grammatical errors

### 6. Special Cases

#### Interpolations (${analysis.interpolations.length} instances)
Keys containing {{variables}} - preserve these exactly, adjust surrounding text

#### Plurals (${analysis.plurals.length} instances)
Adapt plural forms to target language rules (some languages have more than 2 forms)

#### Long Strings (mobile UI constraints)
Strings over 50 characters may need to fit in small mobile screens - be concise

## File Format
- JSON format with nested keys
- UTF-8 encoding
- Preserve JSON structure exactly
- Only translate the string values, not the keys

## Questions or Clarifications
For any ambiguity in context or meaning, please flag for review rather than guessing.

---
Export Date: ${new Date().toISOString()}
Total Strings: ${analysis.totalKeys}
Total Words: ${analysis.totalWords}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'TRANSLATION_INSTRUCTIONS.md'), instructions);
  console.log('✓ Translation instructions created: translation-export/TRANSLATION_INSTRUCTIONS.md');
}

/**
 * Generate glossary
 */
function generateGlossary() {
  const glossaryData = {
    fitnessTerms: {},
    uiElements: {},
    measurements: {}
  };

  // Fitness terms
  const fitnessGlossary = {
    workout: 'Physical exercise session',
    exercise: 'Individual physical activity (e.g., push-ups, squats)',
    training: 'Structured workout program',
    session: 'Single workout occurrence',
    rep: 'Repetition - one complete movement of an exercise',
    reps: 'Plural of rep',
    set: 'Group of consecutive repetitions',
    sets: 'Plural of set',
    weight: 'Resistance load in kilograms',
    cardio: 'Cardiovascular/aerobic exercise',
    strength: 'Resistance training',
    calories: 'Energy burned during exercise',
    duration: 'Length of time',
    rest: 'Recovery time between sets',
    volume: 'Total weight lifted (sets × reps × weight)',
    progression: 'Improvement over time',
    'personal records': 'Best performance achieved'
  };

  Object.entries(fitnessGlossary).forEach(([term, definition]) => {
    glossaryData.fitnessTerms[term] = {
      definition,
      context: 'Core fitness terminology - translate consistently',
      examples: analysis.technicalTerms
        .filter(t => t.terms.includes(term))
        .slice(0, 2)
        .map(t => t.value)
    };
  });

  // UI Elements
  glossaryData.uiElements = {
    button: 'Clickable UI element - use imperative verbs',
    label: 'Form field descriptor - use noun phrases',
    placeholder: 'Form field hint - keep short',
    title: 'Screen/section heading - use Title Case',
    message: 'Informational text - use complete sentences',
    error: 'Error notification - be clear and actionable'
  };

  // Measurements
  glossaryData.measurements = {
    kg: 'Kilograms - weight measurement (adapt for imperial regions if needed)',
    lbs: 'Pounds - imperial weight',
    min: 'Minutes - time abbreviation',
    sec: 'Seconds - time abbreviation',
    cal: 'Calories - energy measurement',
    bpm: 'Beats per minute - heart rate',
    km: 'Kilometers - distance'
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'glossary.json'),
    JSON.stringify(glossaryData, null, 2)
  );
  console.log('✓ Glossary created: translation-export/glossary.json');
}

/**
 * Generate analysis report
 */
function saveAnalysisReport() {
  const report = generateReport();

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'analysis-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Also create human-readable markdown
  const markdown = `# Translation Analysis Report

## Summary
- **Total Namespaces:** ${report.summary.totalNamespaces}
- **Total Translation Keys:** ${report.summary.totalKeys}
- **Total Words:** ${report.summary.totalWords}
- **Estimated Characters:** ~${report.summary.estimatedCharacters}
- **Average Words per Key:** ${report.summary.averageWordsPerKey}

## Namespace Breakdown

| Namespace | Keys | Words | Percentage | Longest String |
|-----------|------|-------|------------|----------------|
${Object.entries(report.namespaceBreakdown).map(([ns, data]) =>
  `| ${ns} | ${data.keys} | ${data.words} | ${data.percentage}% | ${data.longestString.length} chars |`
).join('\n')}

## Special Cases Requiring Attention

- **Interpolations:** ${report.specialCases.interpolations} strings with variables
- **Plurals:** ${report.specialCases.plurals} plural forms
- **Special Formatting:** ${report.specialCases.specialFormatting} strings with emojis/markdown
- **Technical Terms:** ${report.specialCases.technicalTerms} strings with fitness terminology

## Fitness Terminology Glossary
${report.glossary.map(term => `- ${term}`).join('\n')}

## Cost Estimation (6 languages)

### Per Language
- Words: ${report.summary.totalWords}
- Standard rate: $0.12 - $0.20 per word
- Estimated cost per language: $${Math.round(report.summary.totalWords * 0.12)} - $${Math.round(report.summary.totalWords * 0.20)}

### Total (6 languages)
- **Minimum:** $${Math.round(report.summary.totalWords * 0.12 * 6)}
- **Maximum:** $${Math.round(report.summary.totalWords * 0.20 * 6)}
- **Average:** $${Math.round(report.summary.totalWords * 0.16 * 6)}

*Note: Prices vary by translation service and language. Fitness specialization may add 10-20% premium.*

## Recommended Translation Services

### 1. Lokalise
- **Best for:** Continuous localization, developer-friendly
- **Pricing:** ~$0.10-0.15/word + platform fee ($120/mo)
- **Pros:** Git integration, in-context editor, automation
- **Cons:** Monthly platform cost

### 2. Phrase (Memsource)
- **Best for:** Professional quality, CAT tools
- **Pricing:** ~$0.12-0.18/word + platform fee
- **Pros:** Translation memory, quality assurance, API
- **Cons:** Complex setup

### 3. Smartling
- **Best for:** Enterprise, high-quality translations
- **Pricing:** ~$0.15-0.25/word + platform fee ($500/mo)
- **Pros:** Professional translators, quality control, continuous localization
- **Cons:** Higher cost, enterprise-focused

### 4. Crowdin
- **Best for:** Budget-conscious, community translations
- **Pricing:** ~$0.08-0.12/word + platform fee ($50-150/mo)
- **Pros:** Affordable, good UI, integrations
- **Cons:** Variable quality

### 5. One-Time Professional Translation (Gengo, TextMaster)
- **Best for:** Initial translation, budget projects
- **Pricing:** ~$0.06-0.10/word (no platform fee)
- **Pros:** No ongoing costs, simple
- **Cons:** Manual updates, no automation

## Recommendation
For this fitness app with ${report.summary.totalWords} words and 6 languages:

**Option A: Professional Service (Recommended)**
- Service: Lokalise or Phrase
- Estimated total: $${Math.round(report.summary.totalWords * 0.13 * 6)} + $120/mo platform
- Timeline: 2-3 weeks
- Best for: Long-term app with regular updates

**Option B: Budget-Friendly**
- Service: Crowdin + professional review
- Estimated total: $${Math.round(report.summary.totalWords * 0.10 * 6)} + $50/mo
- Timeline: 3-4 weeks
- Best for: Initial launch, later upgrade to Option A

**Option C: One-Time Translation**
- Service: Gengo or similar
- Estimated total: $${Math.round(report.summary.totalWords * 0.08 * 6)} (one-time)
- Timeline: 2-3 weeks
- Best for: Stable content, infrequent updates

---
Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ANALYSIS_REPORT.md'), markdown);
  console.log('✓ Analysis report created: translation-export/ANALYSIS_REPORT.md');
}

/**
 * Main execution
 */
console.log('Analyzing translation files...\n');
analyzeTranslations();

console.log('Generating exports...\n');
exportToCSV();
exportToJSON();
generateInstructions();
generateGlossary();
saveAnalysisReport();

console.log('\n' + '='.repeat(60));
console.log('TRANSLATION ANALYSIS COMPLETE');
console.log('='.repeat(60));

const report = generateReport();
console.log(`\nTotal Keys: ${report.summary.totalKeys}`);
console.log(`Total Words: ${report.summary.totalWords}`);
console.log(`Namespaces: ${report.summary.totalNamespaces}`);
console.log(`\nEstimated Cost (6 languages): $${Math.round(report.summary.totalWords * 0.12 * 6)} - $${Math.round(report.summary.totalWords * 0.20 * 6)}`);
console.log('\nAll files exported to: translation-export/');
console.log('\nNext Steps:');
console.log('1. Review ANALYSIS_REPORT.md for cost estimates and service recommendations');
console.log('2. Send translations-for-translation-service.csv or .json to translation service');
console.log('3. Include TRANSLATION_INSTRUCTIONS.md and glossary.json for translators');
console.log('4. Use import-translations.js script when translations are received');
console.log('');

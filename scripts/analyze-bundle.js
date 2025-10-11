#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle analysis script for Linguamate patterns
function analyzeBundle() {
  console.log('🔍 Analyzing bundle for React patterns...\n');

  try {
    // Check if webpack-bundle-analyzer is available
    try {
      execSync('npx webpack-bundle-analyzer --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('📦 Installing webpack-bundle-analyzer...');
      execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'inherit' });
    }

    // Build the project first
    console.log('🏗️  Building project...');
    execSync('npm run web:build', { stdio: 'inherit' });

    // Analyze bundle
    console.log('📊 Analyzing bundle...');
    const distPath = path.join(process.cwd(), 'dist');
    
    if (fs.existsSync(distPath)) {
      execSync(`npx webpack-bundle-analyzer ${distPath}/static/js/*.js`, { 
        stdio: 'inherit',
        shell: true 
      });
    } else {
      console.log('❌ Dist folder not found. Please run "npm run web:build" first.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

// Pattern-specific analysis
function analyzePatterns() {
  console.log('🎯 Analyzing React patterns usage...\n');

  const patternsDir = path.join(process.cwd(), 'src/patterns');
  const featuresDir = path.join(process.cwd(), 'src/features');
  
  const patterns = {
    contexts: ['SettingsContext', 'AudioEngineContext'],
    memo: ['useExpensiveCalc'],
    lazy: ['lazyScreens', 'ComponentPreloader'],
    renderProps: ['Deferred', 'MouseTracker', 'InputTracker'],
    hocs: ['withAnalytics', 'withLogger'],
  };

  const analysis = {
    totalPatterns: 0,
    usedPatterns: 0,
    patternUsage: {},
    recommendations: [],
  };

  // Count pattern files
  Object.values(patterns).forEach(category => {
    analysis.totalPatterns += category.length;
  });

  // Analyze usage in features
  function analyzeDirectory(dir, relativePath = '') {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        analyzeDirectory(filePath, path.join(relativePath, file));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativeFilePath = path.join(relativePath, file);
        
        // Check for pattern usage
        Object.entries(patterns).forEach(([category, patternList]) => {
          patternList.forEach(pattern => {
            if (content.includes(pattern)) {
              if (!analysis.patternUsage[pattern]) {
                analysis.patternUsage[pattern] = [];
              }
              analysis.patternUsage[pattern].push(relativeFilePath);
              analysis.usedPatterns++;
            }
          });
        });
      }
    });
  }

  analyzeDirectory(featuresDir, 'features');
  analyzeDirectory(patternsDir, 'patterns');

  // Generate recommendations
  const unusedPatterns = Object.values(patterns).flat().filter(pattern => 
    !analysis.patternUsage[pattern]
  );

  if (unusedPatterns.length > 0) {
    analysis.recommendations.push({
      type: 'unused',
      message: `Unused patterns: ${unusedPatterns.join(', ')}`,
      suggestion: 'Consider removing unused patterns or finding use cases for them.'
    });
  }

  const overusedPatterns = Object.entries(analysis.patternUsage)
    .filter(([_, files]) => files.length > 10)
    .map(([pattern, _]) => pattern);

  if (overusedPatterns.length > 0) {
    analysis.recommendations.push({
      type: 'overused',
      message: `Overused patterns: ${overusedPatterns.join(', ')}`,
      suggestion: 'Consider if these patterns are being used appropriately or if there are simpler alternatives.'
    });
  }

  // Output analysis
  console.log('📈 Pattern Usage Analysis:');
  console.log(`Total Patterns: ${analysis.totalPatterns}`);
  console.log(`Used Patterns: ${analysis.usedPatterns}`);
  console.log(`Usage Rate: ${((analysis.usedPatterns / analysis.totalPatterns) * 100).toFixed(1)}%\n`);

  console.log('📋 Pattern Usage Details:');
  Object.entries(analysis.patternUsage).forEach(([pattern, files]) => {
    console.log(`\n${pattern}:`);
    files.forEach(file => console.log(`  - ${file}`));
  });

  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`\n${rec.type.toUpperCase()}: ${rec.message}`);
      console.log(`  ${rec.suggestion}`);
    });
  }

  return analysis;
}

// Performance metrics analysis
function analyzePerformance() {
  console.log('⚡ Analyzing performance metrics...\n');

  const performanceFile = path.join(process.cwd(), 'src/patterns/performance/ReactProfiler.tsx');
  
  if (fs.existsSync(performanceFile)) {
    console.log('✅ React Profiler found');
    console.log('💡 Use the PerformanceDashboard component to monitor render performance');
    console.log('💡 Wrap components with withProfiler() for detailed metrics');
  } else {
    console.log('❌ React Profiler not found');
  }

  // Check for performance anti-patterns
  const antiPatterns = [
    { pattern: /useEffect\(\(\) => \{[^}]*\}, \[\]\)/g, message: 'Empty dependency array in useEffect' },
    { pattern: /useCallback\(\(\) => \{[^}]*\}, \[\]\)/g, message: 'Empty dependency array in useCallback' },
    { pattern: /useMemo\(\(\) => \{[^}]*\}, \[\]\)/g, message: 'Empty dependency array in useMemo' },
  ];

  console.log('\n🔍 Checking for performance anti-patterns...');
  
  function checkFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    antiPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`⚠️  ${message} found in ${filePath}`);
      }
    });
  }

  // Check patterns directory
  const patternsDir = path.join(process.cwd(), 'src/patterns');
  if (fs.existsSync(patternsDir)) {
    const files = fs.readdirSync(patternsDir, { recursive: true });
    files.forEach(file => {
      if (typeof file === 'string' && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        checkFile(path.join(patternsDir, file));
      }
    });
  }
}

// Main analysis function
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--bundle')) {
    analyzeBundle();
  } else if (args.includes('--patterns')) {
    analyzePatterns();
  } else if (args.includes('--performance')) {
    analyzePerformance();
  } else {
    console.log('🔍 Linguamate React Patterns Analysis\n');
    console.log('Usage:');
    console.log('  node scripts/analyze-bundle.js --bundle      # Analyze bundle size');
    console.log('  node scripts/analyze-bundle.js --patterns   # Analyze pattern usage');
    console.log('  node scripts/analyze-bundle.js --performance # Analyze performance');
    console.log('  node scripts/analyze-bundle.js --all        # Run all analyses\n');
    
    if (args.includes('--all')) {
      analyzePatterns();
      analyzePerformance();
      analyzeBundle();
    } else {
      analyzePatterns();
      analyzePerformance();
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundle,
  analyzePatterns,
  analyzePerformance,
};
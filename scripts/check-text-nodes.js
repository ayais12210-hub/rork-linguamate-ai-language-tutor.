#!/usr/bin/env node
// Script to check for potential text node issues in React Native components

const fs = require('fs');
const path = require('path');

// Patterns that might indicate text node issues
const PROBLEMATIC_PATTERNS = [
  // Text directly in View without Text wrapper
  /<View[^>]*>\s*[^<\s][^<]*(?!<\/Text>)/g,
  // String literals in JSX that aren't in Text components
  /{[^}]*['"`][^'"`]*['"`][^}]*}(?![^<]*<\/Text>)/g,
  // Template literals that might render text
  /{`[^`]*`}(?![^<]*<\/Text>)/g,
];

const SAFE_COMPONENTS = [
  'Text',
  'TextInput',
  'Animated.Text',
  'TouchableOpacity',
  'TouchableHighlight',
  'Pressable',
  'Button',
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Split content into lines for better error reporting
  const lines = content.split('\n');
  
  lines.forEach((line, lineNumber) => {
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('import')) {
      return;
    }
    
    // Check for View components with potential text content (only obvious cases)
    const viewMatch = line.match(/<View[^>]*>/);
    if (viewMatch) {
      // Look for text content in the same line
      const restOfLine = line.substring(viewMatch.index + viewMatch[0].length);
      
      // Only flag if there's obvious text content (not code)
      if (restOfLine.trim() && 
          !restOfLine.trim().startsWith('<') && 
          !restOfLine.trim().startsWith('{') &&
          !restOfLine.includes('useRef') &&
          !restOfLine.includes('const ') &&
          !restOfLine.includes('&&') &&
          restOfLine.trim().length > 3) {
        // Check if it's not whitespace or closing tags
        if (!/^\s*(<\/|$)/.test(restOfLine)) {
          issues.push({
            line: lineNumber + 1,
            content: line.trim(),
            issue: 'Potential text content directly in View component',
          });
        }
      }
    }
    
    // Check for string literals that might render as text (not props)
    const stringLiteralMatch = line.match(/{['"`][^'"`]*['"`]}/g);
    if (stringLiteralMatch) {
      stringLiteralMatch.forEach(match => {
        // Skip if it's a prop (has = before it)
        const matchIndex = line.indexOf(match);
        const beforeMatch = line.substring(0, matchIndex);
        
        // Skip common props
        const isProps = /\b(key|testID|accessibilityLabel|placeholder|className|style|id|aria-\w+)\s*=\s*$/.test(beforeMatch);
        if (isProps) return;
        
        // Skip if it's clearly a prop assignment
        if (beforeMatch.includes('=')) return;
        
        // Check if this string is not within a Text component context
        const hasTextComponent = SAFE_COMPONENTS.some(comp => 
          beforeMatch.includes(`<${comp}`) && !beforeMatch.includes(`</${comp}>`)
        );
        
        // Only flag if it looks like it could render as text content
        if (!hasTextComponent && !beforeMatch.includes('=')) {
          issues.push({
            line: lineNumber + 1,
            content: line.trim(),
            issue: `String literal "${match}" may render as text outside Text component`,
          });
        }
      });
    }
  });
  
  return issues;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (!['node_modules', 'dist', 'build', '.expo', '.git'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return 0;
  }
  
  const files = getAllFiles(directory);
  
  let totalIssues = 0;
  
  files.forEach(file => {
    const issues = checkFile(file);
    
    if (issues.length > 0) {
      console.log(`\n📄 ${file}:`);
      issues.forEach(issue => {
        console.log(`  ⚠️  Line ${issue.line}: ${issue.issue}`);
        console.log(`     ${issue.content}`);
      });
      totalIssues += issues.length;
    }
  });
  
  return totalIssues;
}

function main() {
  console.log('🔍 Checking for potential React Native text node issues...\n');
  
  const directories = ['app', 'components', 'modules', 'home'];
  let totalIssues = 0;
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Checking ${dir}/...`);
      totalIssues += checkDirectory(dir);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (totalIssues === 0) {
    console.log('✅ No potential text node issues found!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${totalIssues} potential text node issues.`);
    console.log('\n💡 Tips to fix:');
    console.log('  • Wrap text content in <Text> components');
    console.log('  • Use conditional rendering: {text && <Text>{text}</Text>}');
    console.log('  • Ensure string interpolation is within Text components');
    console.log('  • Check ESLint rule: react-native/no-raw-text');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
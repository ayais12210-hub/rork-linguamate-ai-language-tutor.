#!/usr/bin/env node

/**
 * Script to patch expo-router files for React 19 compatibility
 * This script fixes the "use is not a function" error by replacing
 * react_1.use with react_1.useContext in the compiled expo-router files.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Patching expo-router for React 19 compatibility...');

// Function to find and patch files
function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace react_1.use with react_1.useContext
    content = content.replace(/react_1\.use\(/g, 'react_1.useContext(');
    
    // Also replace any other variations
    content = content.replace(/\(0,\s*react_1\.use\)/g, '(0, react_1.useContext)');
    content = content.replace(/react_1\["use"\]/g, 'react_1["useContext"]');
    content = content.replace(/react_1\['use'\]/g, "react_1['useContext']");
    
    if (content !== originalContent) {
      // Create backup
      fs.writeFileSync(filePath + '.backup', originalContent);
      
      // Write patched content
      fs.writeFileSync(filePath, content);
      
      console.log(`✅ Patched: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error patching ${filePath}:`, error.message);
    return false;
  }
}

// Function to find expo-router files recursively
function findExpoRouterFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findExpoRouterFiles(fullPath));
    } else if (item.endsWith('.js') && fullPath.includes('expo-router')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
function main() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules not found. Please run npm install first.');
    process.exit(1);
  }
  
  const expoRouterPath = path.join(nodeModulesPath, 'expo-router');
  
  if (!fs.existsSync(expoRouterPath)) {
    console.log('❌ expo-router not found in node_modules.');
    process.exit(1);
  }
  
  console.log(`📁 Searching for expo-router files in: ${expoRouterPath}`);
  
  const files = findExpoRouterFiles(expoRouterPath);
  
  if (files.length === 0) {
    console.log('⚠️ No expo-router .js files found to patch.');
    process.exit(0);
  }
  
  console.log(`📄 Found ${files.length} files to check:`);
  files.forEach(file => console.log(`   - ${file}`));
  
  let patchedCount = 0;
  
  for (const file of files) {
    if (patchFile(file)) {
      patchedCount++;
    }
  }
  
  console.log(`\n🎉 Patching complete! Patched ${patchedCount} files.`);
  
  if (patchedCount > 0) {
    console.log('✅ expo-router is now compatible with React 19!');
    console.log('   The "use is not a function" error should be resolved.');
  }
}

// Run the script
main();
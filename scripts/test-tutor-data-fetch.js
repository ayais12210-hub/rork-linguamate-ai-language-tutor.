#!/usr/bin/env node

// Simple test script to verify tutor data fetching functionality
const https = require('https');
const http = require('http');

const TUTOR_URL = 'https://linguamate-ai-language-tutor-1yzk6my-76pccekj-lg0fppmq.rork.app';

console.log('🧪 Testing Tutor Data Fetching...');
console.log(`📍 Target URL: ${TUTOR_URL}`);
console.log('');

// Test function to fetch data from the URL
function testFetchTutorData(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            size: data.length
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            headers: res.headers,
            data: data.substring(0, 200) + '...', // First 200 chars
            size: data.length,
            error: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

// Run the test
async function runTest() {
  try {
    console.log('⏳ Fetching data...');
    const result = await testFetchTutorData(TUTOR_URL);
    
    console.log('✅ Fetch completed!');
    console.log(`📊 Status: ${result.status}`);
    console.log(`📏 Size: ${result.size} bytes`);
    console.log(`🔗 Content-Type: ${result.headers['content-type'] || 'Unknown'}`);
    console.log('');
    
    if (result.success) {
      console.log('📋 Data Structure:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Failed to parse JSON:');
      console.log(result.data);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(error);
  }
}

// Run the test
runTest();
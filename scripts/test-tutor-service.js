#!/usr/bin/env node

// Test script for the tutor data service
const https = require('https');

const TUTOR_URL = 'https://linguamate-ai-language-tutor-1yzk6my-76pccekj-lg0fppmq.rork.app';

console.log('🧪 Testing Tutor Data Service...');
console.log(`📍 Target URL: ${TUTOR_URL}`);
console.log('');

// Simulate the tutor data fetcher logic
function testTutorDataService(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          const contentLength = parseInt(res.headers['content-length'] || '0', 10);
          
          // Extract title from HTML
          const titleMatch = data.match(/<title[^>]*>([^<]*)<\/title>/i);
          const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : null;
          
          // Extract description from HTML
          const metaDescMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
          const description = metaDescMatch && metaDescMatch[1] ? metaDescMatch[1].trim() : null;
          
          // Create processed data structure
          const processedData = {
            id: `html-${Date.now()}`,
            title: title || 'Web Content',
            description: description,
            language: 'en',
            level: 'unknown',
            contentType: contentType.includes('html') ? 'html' : 'text',
            rawContent: data,
            metadata: {
              sourceUrl: url,
              contentType: contentType,
              contentLength: contentLength,
              createdAt: new Date().toISOString(),
            }
          };
          
          resolve({
            success: true,
            status: res.statusCode,
            data: processedData
          });
        } catch (error) {
          reject({
            success: false,
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
    console.log('⏳ Fetching and processing data...');
    const result = await testTutorDataService(TUTOR_URL);
    
    console.log('✅ Processing completed!');
    console.log(`📊 Status: ${result.status}`);
    console.log('');
    
    if (result.success) {
      console.log('📋 Processed Data Structure:');
      console.log(`  ID: ${result.data.id}`);
      console.log(`  Title: ${result.data.title}`);
      console.log(`  Description: ${result.data.description || 'N/A'}`);
      console.log(`  Language: ${result.data.language}`);
      console.log(`  Level: ${result.data.level}`);
      console.log(`  Content Type: ${result.data.contentType}`);
      console.log(`  Content Length: ${result.data.metadata.contentLength} bytes`);
      console.log(`  Source URL: ${result.data.metadata.sourceUrl}`);
      console.log(`  Created At: ${result.data.metadata.createdAt}`);
      console.log('');
      console.log('🎉 Successfully processed HTML content into structured data!');
    }
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(error);
  }
}

// Run the test
runTest();
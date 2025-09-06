#!/usr/bin/env node

// Test the herbs API endpoints
async function testAPIEndpoints() {
  const baseUrl = 'http://localhost:3000/api/herbs';
  
  console.log('🌐 Testing Herbs API Endpoints...\n');

  const tests = [
    {
      name: 'Get all herbs (paginated)',
      url: `${baseUrl}?limit=5`,
      description: 'Should return first 5 herbs'
    },
    {
      name: 'Full-text search',
      url: `${baseUrl}?q=depression`,
      description: 'Should find herbs related to depression'
    },
    {
      name: 'Search by action',
      url: `${baseUrl}?action=antidepressant`,
      description: 'Should find herbs with antidepressant action'
    },
    {
      name: 'Search by indication',
      url: `${baseUrl}?indication=anxiety`,
      description: 'Should find herbs for anxiety'
    },
    {
      name: 'Search by constituent',
      url: `${baseUrl}?constituent=flavonoid`,
      description: 'Should find herbs containing flavonoids'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}...`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url);
      
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log(`   ✅ Success: Found ${data.length} results`);
        if (data.length > 0) {
          console.log(`   📋 Sample: ${data[0].common_name || 'Unknown'} (${data[0].latin_name || 'Unknown'})`);
        }
      } else if (data.error) {
        console.log(`   ❌ API Error: ${data.error}`);
      } else {
        console.log(`   ✅ Success: Single result - ${data.common_name || 'Unknown'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('   💡 Make sure your development server is running: npm run dev');
      }
    }
    
    console.log();
  }

  console.log('🎯 API endpoint testing complete!');
  console.log('\n💡 To run these tests:');
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Set DATABASE_URL environment variable');
  console.log('3. Run migration: DATABASE_URL="..." node database/migrate-to-postgres.js');
  console.log('4. Run this test: node test-api-endpoints.js');
}

testAPIEndpoints();

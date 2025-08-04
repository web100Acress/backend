const axios = require('axios');

const API_BASE_URL = 'http://localhost:3500'; // Adjust port as needed

async function testProjectOrderAPI() {
  console.log('🧪 Testing Project Order API...\n');

  try {
    // Test 1: Get all project orders for sync
    console.log('1. Testing GET /projectOrder/sync');
    const syncResponse = await axios.get(`${API_BASE_URL}/projectOrder/sync`);
    console.log('✅ Sync endpoint working:', syncResponse.data);
    console.log('');

    // Test 2: Get project order for specific builder
    console.log('2. Testing GET /projectOrder/builder/test-builder');
    const builderResponse = await axios.get(`${API_BASE_URL}/projectOrder/builder/test-builder`);
    console.log('✅ Builder endpoint working:', builderResponse.data);
    console.log('');

    // Test 3: Save project order (requires admin token)
    console.log('3. Testing POST /projectOrder/save (requires admin token)');
    try {
      const saveResponse = await axios.post(`${API_BASE_URL}/projectOrder/save`, {
        builderName: 'test-builder',
        customOrder: ['project1', 'project2', 'project3'],
        hasCustomOrder: true,
        randomSeed: 12345
      }, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        }
      });
      console.log('✅ Save endpoint working:', saveResponse.data);
    } catch (error) {
      console.log('⚠️ Save endpoint requires admin token:', error.response?.data || error.message);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('\n📝 Note: Admin endpoints require authentication token');
    console.log('📝 To test admin endpoints, replace YOUR_ADMIN_TOKEN_HERE with actual token');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProjectOrderAPI(); 
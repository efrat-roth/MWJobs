// Simple test script to verify validation error handling
// Run with: node test-validation.js

async function testValidationErrors() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing validation error handling...\n');
  
  // Test 1: Invalid signup data
  console.log('Test 1: Invalid signup data');
  try {
    const response = await fetch(`${baseUrl}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventIds: [], // Empty array should fail
        fullName: 'A', // Too short
        idNumber: '12345', // Too short
        phone: 'invalid', // Invalid format
        city: 'B', // Too short
        dateOfBirth: '2020-01-01' // Under 18
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.errors && result.errors.length > 0) {
      console.log('✅ Hebrew validation messages found:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('❌ No validation errors found in response');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Invalid event data (for admin)
  console.log('Test 2: Invalid event data');
  try {
    const response = await fetch(`${baseUrl}/api/events/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AB', // Too short
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        startTime: '25:99', // Invalid time
        endTime: '25:99', // Invalid time
        workerLimit: -1 // Invalid number
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.errors && result.errors.length > 0) {
      console.log('✅ Hebrew validation messages found:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('❌ No validation errors found in response');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the tests
testValidationErrors().catch(console.error);

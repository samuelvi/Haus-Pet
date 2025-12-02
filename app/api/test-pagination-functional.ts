/**
 * Functional test for pagination
 * Tests the N+1 fetch pattern with 12 pets
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

interface PaginationMeta {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

async function testPagination() {
  console.log('🧪 Testing Pagination with 12 pets (limit=10)');
  console.log('================================================\n');

  try {
    // Test Page 1
    console.log('📄 Test 1: Page 1 (limit=10)');
    const page1Response = await fetch(`${API_URL}/api/pets?page=1&limit=10`);
    const page1Json: any = await page1Response.json();

    if (page1Json.status === 'OK') {
      const page1 = page1Json.data as PaginatedResponse<any>;
      console.log(`✅ Items returned: ${page1.items.length}`);
      console.log(`✅ Pagination:`, page1.pagination);
      console.log(`   - hasNext: ${page1.pagination.hasNext} (expected: true)`);
      console.log(`   - hasPrevious: ${page1.pagination.hasPrevious} (expected: false)`);

      if (page1.items.length === 10 && page1.pagination.hasNext && !page1.pagination.hasPrevious) {
        console.log('✅ Page 1 test PASSED\n');
      } else {
        console.log('❌ Page 1 test FAILED\n');
      }
    } else {
      console.log(`❌ Error: ${page1Json.message}\n`);
    }

    // Test Page 2
    console.log('📄 Test 2: Page 2 (limit=10)');
    const page2Response = await fetch(`${API_URL}/api/pets?page=2&limit=10`);
    const page2Json: any = await page2Response.json();

    if (page2Json.status === 'OK') {
      const page2 = page2Json.data as PaginatedResponse<any>;
      console.log(`✅ Items returned: ${page2.items.length}`);
      console.log(`✅ Pagination:`, page2.pagination);
      console.log(`   - hasNext: ${page2.pagination.hasNext} (expected: false, only 2 items left)`);
      console.log(`   - hasPrevious: ${page2.pagination.hasPrevious} (expected: true)`);

      if (page2.items.length === 2 && !page2.pagination.hasNext && page2.pagination.hasPrevious) {
        console.log('✅ Page 2 test PASSED\n');
      } else {
        console.log('❌ Page 2 test FAILED\n');
      }
    } else {
      console.log(`❌ Error: ${page2Json.message}\n`);
    }

    // Test Page 3 (should have no items)
    console.log('📄 Test 3: Page 3 (should be empty)');
    const page3Response = await fetch(`${API_URL}/api/pets?page=3&limit=10`);
    const page3Json: any = await page3Response.json();

    if (page3Json.status === 'OK') {
      const page3 = page3Json.data as PaginatedResponse<any>;
      console.log(`✅ Items returned: ${page3.items.length}`);
      console.log(`✅ Pagination:`, page3.pagination);
      console.log(`   - hasNext: ${page3.pagination.hasNext} (expected: false)`);
      console.log(`   - hasPrevious: ${page3.pagination.hasPrevious} (expected: true)`);

      if (page3.items.length === 0 && !page3.pagination.hasNext && page3.pagination.hasPrevious) {
        console.log('✅ Page 3 test PASSED\n');
      } else {
        console.log('❌ Page 3 test FAILED\n');
      }
    } else {
      console.log(`❌ Error: ${page3Json.message}\n`);
    }

    console.log('================================================');
    console.log('✅ All pagination tests completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPagination();

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log("Starting Query API Tests...");

  let userToken = '';
  let adminToken = '';

  // Setup: Login User
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'user123' })
    });
    const data = await res.json();
    userToken = data.token;
  } catch (err) {
    console.error("[FAIL] User login failed:", err.message);
    return;
  }

  // Setup: Login Admin
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    const data = await res.json();
    adminToken = data.token;
  } catch (err) {
    console.error("[FAIL] Admin login failed:", err.message);
    return;
  }

  let testQueryId = null;

  // Test 1: Submit support query as regular user (Expect 201)
  try {
    const res = await fetch(`${API_URL}/queries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Cannot download image asset',
        message: 'Hello support, every time I click download on homepage_mockup.png, the progress bar finishes but my browser complains about safe-guard download permissions. Can you help?'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.query) {
      console.log(`[PASS] Submit Query: Status ${res.status} (Expected 201)`);
      testQueryId = data.query._id;
    } else {
      console.error(`[FAIL] Submit Query: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Submit Query error:", err.message);
  }

  // Test 2: Standard user tries to fetch queries (Expect 403 Forbidden)
  try {
    const res = await fetch(`${API_URL}/queries`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (res.status === 403 && data.error) {
      console.log(`[PASS] Block standard user from Admin list: Status ${res.status} (Expected 403)`);
    } else {
      console.error(`[FAIL] Block standard user from Admin list: Status ${res.status} (Expected 403)`, data);
    }
  } catch (err) {
    console.error("[FAIL] Block standard user list error:", err.message);
  }

  // Test 3: Admin fetches queries (Expect 200 and array populated with user details)
  try {
    const res = await fetch(`${API_URL}/queries`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    const hasMyQuery = data.queries.some(q => q._id === testQueryId && q.userId?.email === 'user@example.com');
    if (res.status === 200 && data.queries && hasMyQuery) {
      console.log(`[PASS] Admin list queries: Status ${res.status}, populated user: "${data.queries[0]?.userId?.name}" (Expected 200)`);
    } else {
      console.error(`[FAIL] Admin list queries: Status ${res.status}, hasMyQuery: ${hasMyQuery}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Admin list queries error:", err.message);
  }

  // Test 4: Admin marks query as resolved (Expect 200)
  if (testQueryId) {
    try {
      const res = await fetch(`${API_URL}/queries/${testQueryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.status === 200 && data.success && data.query?.status === 'resolved') {
        console.log(`[PASS] Admin Resolve Query: Status ${res.status}, updated status: "${data.query.status}" (Expected 200)`);
      } else {
        console.error(`[FAIL] Admin Resolve Query: Status ${res.status}`, data);
      }
    } catch (err) {
      console.error("[FAIL] Admin Resolve Query error:", err.message);
    }
  }
};

runTests();

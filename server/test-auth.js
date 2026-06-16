const API_URL = 'http://localhost:5000/api/auth';

const runTests = async () => {
  console.log("Starting Auth API Tests using built-in fetch...");

  // Test 1: Register User (Expect 201)
  let testUser = {
    name: "John Doe",
    email: `john_${Date.now()}@example.com`,
    password: "password123"
  };

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log(`[PASS] Register: Status ${res.status} (Expected 201)`);
      console.log("Registered User ID:", data.user.id);
    } else {
      console.error(`[FAIL] Register: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Register error:", err.message);
  }

  // Test 2: Register Duplicate User (Expect 400)
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log(`[PASS] Duplicate Register: Status ${res.status} - ${data.message} (Expected 400)`);
    } else {
      console.error(`[FAIL] Duplicate Register: Status ${res.status} (Expected 400)`);
    }
  } catch (err) {
    console.error("[FAIL] Duplicate Register error:", err.message);
  }

  // Test 3: Login User (Expect 200)
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log(`[PASS] Login: Status ${res.status} (Expected 200)`);
    } else {
      console.error(`[FAIL] Login: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Login error:", err.message);
  }

  // Test 4: Login User with Wrong Password (Expect 401)
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: "wrongpassword" })
    });
    const data = await res.json();
    if (res.status === 401) {
      console.log(`[PASS] Login Invalid Password: Status ${res.status} - ${data.message} (Expected 401)`);
    } else {
      console.error(`[FAIL] Login Invalid Password: Status ${res.status} (Expected 401)`);
    }
  } catch (err) {
    console.error("[FAIL] Login Invalid Password error:", err.message);
  }

  // Test 5: Forgot Password - Existing User (Expect 200)
  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log(`[PASS] Forgot Password Existing: Status ${res.status} (Expected 200)`);
    } else {
      console.error(`[FAIL] Forgot Password Existing: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Forgot Password Existing error:", err.message);
  }

  // Test 6: Forgot Password - Non-existing User (Expect 404)
  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' })
    });
    const data = await res.json();
    if (res.status === 404) {
      console.log(`[PASS] Forgot Password Non-existing: Status ${res.status} - ${data.message} (Expected 404)`);
    } else {
      console.error(`[FAIL] Forgot Password Non-existing: Status ${res.status} (Expected 404)`);
    }
  } catch (err) {
    console.error("[FAIL] Forgot Password Non-existing error:", err.message);
  }
};

runTests();

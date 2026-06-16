const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log("Starting Upload API Integration Tests...");
  
  // 1. Login as Admin
  let adminToken = '';
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    const data = await res.json();
    adminToken = data.token;
    console.log("Logged in as Admin successfully.");
  } catch (err) {
    console.error("Admin login failed:", err.message);
    return;
  }

  // 2. Prepare FormData for file upload
  const formData = new FormData();
  formData.append('title', 'Admin Custom Readme');
  formData.append('description', 'This is a custom document uploaded via dashboard forms.');
  
  const fileBlob = new Blob(['Hello World! This is an uploaded text file from admin dashboard.'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'custom-admin-readme.txt');

  // 3. Post to upload endpoint
  let uploadedAssetId = '';
  try {
    const res = await fetch(`${API_URL}/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      console.log(`[PASS] Upload Asset: Status ${res.status} (Expected 201)`);
      uploadedAssetId = data.asset._id;
    } else {
      console.error(`[FAIL] Upload Asset: Status ${res.status}`, data);
      return;
    }
  } catch (err) {
    console.error("[FAIL] Upload Asset error:", err.message);
    return;
  }

  // 4. Download file and verify content
  if (uploadedAssetId) {
    try {
      // Get download URL
      const dlRes = await fetch(`${API_URL}/assets/${uploadedAssetId}/download`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const dlData = await dlRes.json();
      console.log("Generated signed download link:", dlData.downloadUrl);
      
      // Request download contents
      const fileRes = await fetch(dlData.downloadUrl);
      const fileText = await fileRes.text();
      
      if (fileRes.status === 200 && fileText.includes('Hello World! This is an uploaded text file')) {
        console.log(`[PASS] Verify Uploaded File Content: Status ${fileRes.status}`);
        console.log(`Contents read back: "${fileText}"`);
      } else {
        console.error(`[FAIL] Verify Uploaded File Content: Status ${fileRes.status}, Contents: "${fileText}"`);
      }
    } catch (err) {
      console.error("[FAIL] File validation error:", err.message);
    }
  }
};

runTests();

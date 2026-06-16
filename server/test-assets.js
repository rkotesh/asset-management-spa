const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log("Starting Asset API Tests...");

  let token = '';

  // Step 1: Login to get token
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'user123' })
    });
    const data = await res.json();
    if (res.status === 200) {
      token = data.token;
      console.log("[PASS] Authenticated successfully with seeded user credentials!");
    } else {
      console.error("[FAIL] Login failed during setup:", data);
      return;
    }
  } catch (err) {
    console.error("[FAIL] Login error during setup:", err.message);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Step 2: Fetch all assets (Expect 10 seeded assets)
  let testAsset = null;
  try {
    const res = await fetch(`${API_URL}/assets`, { headers });
    const data = await res.json();
    if (res.status === 200 && data.assets && data.assets.length >= 10) {
      console.log(`[PASS] List Assets: Status ${res.status}, Retrieved ${data.assets.length} assets (Expected >= 10)`);
      testAsset = data.assets[0];
    } else {
      console.error(`[FAIL] List Assets: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] List Assets error:", err.message);
  }

  if (!testAsset) {
    console.error("Stopping tests as no assets were retrieved to test detail endpoints.");
    return;
  }

  // Step 3: Fetch assets with Search keyword "Report" (Expect only report)
  try {
    const res = await fetch(`${API_URL}/assets?search=Report`, { headers });
    const data = await res.json();
    const hasReport = data.assets.some(a => a.title.includes('Report'));
    if (res.status === 200 && hasReport) {
      console.log(`[PASS] Search Assets ("Report"): Status ${res.status}, found matching assets (e.g. "${data.assets[0]?.title}")`);
    } else {
      console.error(`[FAIL] Search Assets ("Report"): Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Search Assets error:", err.message);
  }

  // Step 4: Fetch assets with Filter type "image" (Expect only image)
  try {
    const res = await fetch(`${API_URL}/assets?type=image`, { headers });
    const data = await res.json();
    const allImages = data.assets.every(a => a.fileType === 'image');
    if (res.status === 200 && allImages && data.assets.length > 0) {
      console.log(`[PASS] Filter Assets (type=image): Status ${res.status}, retrieved ${data.assets.length} image files`);
    } else {
      console.error(`[FAIL] Filter Assets (type=image): Status ${res.status}, allImages: ${allImages}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Filter Assets error:", err.message);
  }

  // Step 5: Fetch single asset detail by ID (Expect 200)
  try {
    const res = await fetch(`${API_URL}/assets/${testAsset._id}`, { headers });
    const data = await res.json();
    if (res.status === 200 && data.asset && data.asset._id === testAsset._id) {
      console.log(`[PASS] Asset Detail: Status ${res.status}, Retrieved "${data.asset.title}"`);
    } else {
      console.error(`[FAIL] Asset Detail: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Asset Detail error:", err.message);
  }

  // Step 6: Fetch download signed URL (Expect 200)
  let downloadUrl = '';
  try {
    const res = await fetch(`${API_URL}/assets/${testAsset._id}/download`, { headers });
    const data = await res.json();
    if (res.status === 200 && data.downloadUrl) {
      console.log(`[PASS] Generate Download URL: Status ${res.status}, Generated: ${data.downloadUrl}`);
      downloadUrl = data.downloadUrl;
    } else {
      console.error(`[FAIL] Generate Download URL: Status ${res.status}`, data);
    }
  } catch (err) {
    console.error("[FAIL] Generate Download URL error:", err.message);
  }

  // Step 7: Stream mock download file content (Expect 200 and file bytes)
  if (downloadUrl) {
    try {
      const res = await fetch(downloadUrl);
      const contentDisposition = res.headers.get('content-disposition');
      const text = await res.text();
      if (res.status === 200 && contentDisposition && contentDisposition.includes('attachment')) {
        console.log(`[PASS] Stream Mock File content: Status ${res.status}, Content-Disposition header verified, Streamed content length: ${text.length} chars`);
      } else {
        console.error(`[FAIL] Stream Mock File content: Status ${res.status}, headers:`, res.headers);
      }
    } catch (err) {
      console.error("[FAIL] Stream Mock File content error:", err.message);
    }
  }
};

runTests();

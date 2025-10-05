# Device Authorization Testing Guide

## Prerequisites

1. **Run the migration** (if not already done):
```bash
npm run db:migrate
```

2. **Set up environment variables** in your `.env.local`:
```bash
# Optional: Comma-separated list of allowed client IDs for validation
# If not set, any client_id will be accepted (fine for development)
DEVICE_AUTH_ALLOWED_CLIENT_IDS="vscode-extension,bounty-cli,demo-cli"
```

3. **Start the dev server**:
```bash
npm run dev:web
```

## Testing Flow

### Option 1: Quick Test Using Browser DevTools

1. **Request a device code** - Open browser console and run:
```javascript
const response = await fetch('http://localhost:3000/api/auth/device/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'demo-cli',
    scope: 'openid profile email'
  })
});
const data = await response.json();
console.log(data);
```

You'll get a response like:
```json
{
  "device_code": "abc123...",
  "user_code": "ABCD-1234",
  "verification_uri": "http://localhost:3000/device",
  "verification_uri_complete": "http://localhost:3000/device?user_code=ABCD-1234",
  "expires_in": 1800,
  "interval": 5
}
```

2. **Verify the code**:
   - Visit the `verification_uri_complete` URL
   - Or go to `http://localhost:3000/device` and enter the `user_code` manually

3. **Approve the device**:
   - Sign in if not already signed in
   - Click "Approve" on the authorization page

4. **Poll for the token** - In console:
```javascript
const tokenResponse = await fetch('http://localhost:3000/api/auth/device/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: 'abc123...', // Use device_code from step 1
    client_id: 'demo-cli'
  })
});
const tokenData = await tokenResponse.json();
console.log(tokenData);
```

If approved, you'll get:
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Option 2: Test with curl

```bash
# Step 1: Request device code
curl -X POST http://localhost:3000/api/auth/device/code \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "demo-cli",
    "scope": "openid profile email"
  }'

# Step 2: Visit the verification_uri_complete in your browser and approve

# Step 3: Poll for token (replace DEVICE_CODE with actual device_code)
curl -X POST http://localhost:3000/api/auth/device/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
    "device_code": "DEVICE_CODE",
    "client_id": "demo-cli"
  }'
```

### Option 3: Create a Simple Test Script

Create `test-device-auth.js`:

```javascript
const BASE_URL = 'http://localhost:3000';
const CLIENT_ID = 'demo-cli';

async function testDeviceFlow() {
  console.log('🔐 Testing Device Authorization Flow\n');

  // Step 1: Request device code
  console.log('📱 Step 1: Requesting device code...');
  const codeResponse = await fetch(`${BASE_URL}/api/auth/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: 'openid profile email'
    })
  });

  const codeData = await codeResponse.json();
  console.log('✅ Received device code');
  console.log(`\n👉 Visit: ${codeData.verification_uri_complete}`);
  console.log(`👉 Or enter code: ${codeData.user_code}\n`);

  // Step 2: Wait for user to approve
  console.log('⏳ Waiting for approval (polling every 5 seconds)...\n');
  
  let approved = false;
  let attempts = 0;
  const maxAttempts = 20; // 100 seconds

  while (!approved && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    const tokenResponse = await fetch(`${BASE_URL}/api/auth/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: codeData.device_code,
        client_id: CLIENT_ID
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      console.log('✅ Authorization successful!');
      console.log('🎉 Access token:', tokenData.access_token.substring(0, 20) + '...');
      approved = true;
    } else if (tokenData.error === 'authorization_pending') {
      console.log(`⏳ Still waiting... (attempt ${attempts}/${maxAttempts})`);
    } else if (tokenData.error === 'access_denied') {
      console.log('❌ Access was denied by the user');
      break;
    } else if (tokenData.error === 'expired_token') {
      console.log('❌ Device code expired');
      break;
    } else {
      console.log('❌ Error:', tokenData.error || tokenData.message);
      break;
    }
  }

  if (!approved && attempts >= maxAttempts) {
    console.log('⏱️  Timeout: No approval received');
  }
}

testDeviceFlow().catch(console.error);
```

Run it:
```bash
node test-device-auth.js
```

## Testing Error Cases

### 1. Test Invalid Code
```bash
curl http://localhost:3000/api/auth/device?user_code=INVALID
# Should return error
```

### 2. Test Denial
- Request a device code
- Visit the verification URL
- Click "Deny"
- Try to poll for token - should return `access_denied`

### 3. Test Expiration
- Request a device code
- Wait 30+ minutes (or modify `expiresIn` in `packages/auth/src/server.ts` to `"30s"` for faster testing)
- Try to use the code - should return `expired_token`

### 4. Test Polling Too Fast
- Poll with interval < 5 seconds
- Should return `slow_down` error

## What to Look For

✅ **Success Indicators:**
- Device code is generated and displayed
- Verification page loads with the code
- User can approve/deny
- Toast notifications appear
- Access token is returned after approval

❌ **Common Issues:**
- Database migration not run → Run `npm run db:migrate`
- Session not working → Make sure you're signed in
- 401 errors → Check `BETTER_AUTH_SECRET` is set
- Client validation failing → Check `DEVICE_AUTH_ALLOWED_CLIENT_IDS`

## Next Steps

Once this works, you can:
1. Build your VS Code extension using this flow
2. Create a CLI tool (see the better-auth docs example)
3. Use the access token to make authenticated API requests

## Useful Links
- Device flow: http://localhost:3000/device
- API endpoints:
  - POST `/api/auth/device/code` - Request device code
  - GET `/api/auth/device?user_code=XXX` - Verify code
  - POST `/api/auth/device/approve` - Approve device
  - POST `/api/auth/device/deny` - Deny device
  - POST `/api/auth/device/token` - Get access token

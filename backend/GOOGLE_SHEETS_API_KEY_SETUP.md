# Quick Setup: Google Sheets API Key

## 🎯 For CAs with Many Clients

Perfect solution! One key for all your clients.

## ⚡ 3-Step Setup

### Step 1: Generate Key (30 seconds)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (example):
```
32131231222222222222222222222222222222222222222222222
```

### Step 2: Add to Render (2 minutes)
1. Render Dashboard → Backend Service → Environment
2. Add variable:
   - Key: `GOOGLE_SHEETS_API_KEY`
   - Value: `32131231222222222222222222222222222222222222222222222`
3. Save Changes

### Step 3: Share with Clients (2 minutes)
Send this to all 100 clients:

```
Hi! Upload your CAS at [your-website.com]

API Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

Enter this key when uploading to track your portfolio.
```

## ✅ Done!

- ✅ Your clients → Enter key → Data appends
- ❌ Random users → No key → Data doesn't append
- 🎉 Clean Google Sheet with only client data!

## 📚 Full Guide

See `docs/GOOGLE_SHEETS_API_KEY.md` for:
- Detailed instructions
- Client communication templates
- Security best practices
- Troubleshooting

## 🧪 Test

1. Upload CAS with key → Should append ✅
2. Upload CAS without key → Should NOT append ❌

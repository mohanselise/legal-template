# Quick Start Guide

## For Backend Developers

This folder contains a complete standalone test that reproduces the SELISE Storage API issue.

### Run the test:
```bash
node test-upload-download.js
```

**That's it!** No dependencies, no setup, no configuration needed.

### What it does:

✅ **Step 1**: Gets access token (prints token validity)  
✅ **Step 2**: Uploads PDF to SELISE Storage (prints File ID)  
❌ **Step 3**: Tries to download using GetFile API (currently fails)

### Current Error:

```
Response Status: 401 Unauthorized
Response Body: Verb parameter is missing
```

### The Issue:

The GetFile API is returning "Verb parameter is missing" but:
- No `Verb` parameter is mentioned in the API documentation
- The documentation shows this exact request format should work
- We're following the documented API spec exactly

### Need Help With:

1. What is the `Verb` parameter?
2. What values are accepted?
3. Is the API documentation complete?
4. Should we use a different endpoint?

---

See `README.md` for full details and API documentation references.

# 🔧 FIX LỖI 500 - FUNCTION_INVOCATION_FAILED

## Lỗi bạn gặp phải

```
HTTP 500: A server error has occurred
FUNCTION_INVOCATION_FAILED
```

---

## 🎯 NGUYÊN NHÂN

Serverless function bị crash do:
1. ❌ **Dependencies thiếu** - `form-data`, `axios` chưa được install
2. ❌ **Import sai** - `require('form-data')` trong TypeScript module
3. ❌ **fetch() không support FormData** - Native fetch API issue

---

## ✅ ĐÃ FIX

### **1. Move dependencies lên root `package.json`:**

**Before:**
```
/api/package.json có dependencies
/package.json không có API dependencies
→ Vercel không install được
```

**After:**
```json
{
  "dependencies": {
    "@vercel/node": "^3.0.0",
    "form-data": "^4.0.0",
    "axios": "^1.6.0"
  }
}
```

### **2. Fix import trong `save-to-lark.ts`:**

**Before:**
```typescript
const FormData = require('form-data');  // ❌ CommonJS
await fetch(url, { body: formData });    // ❌ fetch không support
```

**After:**
```typescript
import FormData from 'form-data';        // ✅ ES6 import
import axios from 'axios';               // ✅ axios support FormData
await axios.post(url, formData, {...});  // ✅ Works!
```

---

## 🚀 DEPLOY NGAY

### **Option 1: Deploy code mới (RECOMMENDED)**

```bash
# 1. Extract code đã fix
unzip cvtohireteacher-fixed-v3.zip
cd cvtohireteacher-main

# 2. Install dependencies
npm install

# 3. Deploy
vercel --prod

# When asked:
# Framework? → Other
# Build Command? → (Enter)
# Output Directory? → ./
```

**✅ Done! Chờ 1-2 phút.**

---

### **Option 2: Fix manually (nếu đã deploy)**

**Step 1:** Update `package.json`

Add vào dependencies:
```json
"@vercel/node": "^3.0.0",
"form-data": "^4.0.0",
"axios": "^1.6.0"
```

**Step 2:** Update `/api/save-to-lark.ts`

Replace top của file:
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import axios from 'axios';
```

Replace fetch calls với axios:
```typescript
// Get token
const authResponse = await axios.post(url, data);

// Upload file
const uploadResponse = await axios.post(url, formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    ...formData.getHeaders()
  }
});

// Send webhook
await axios.post(webhookUrl, payload);
```

**Step 3:** Redeploy
```bash
vercel --prod
```

---

## 🧪 TEST SAU KHI FIX

### **Test 1: Check deployment**
```
Vercel Dashboard → Deployments → Build Logs
→ Phải thấy: "Build Completed"
→ Không có errors
```

### **Test 2: Test API endpoint**
```bash
curl -X POST https://your-app.vercel.app/api/save-to-lark \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected:
```json
{
  "success": false,
  "error": "Cannot read properties..."
}
```
**OK!** Function chạy được (chỉ thiếu data)

### **Test 3: Test full flow**
1. Vào app URL
2. Upload CV
3. Extract
4. Review
5. Click "Lưu"
6. ✅ Should work!

---

## 🐛 NẾU VẪN LỖI

### **Lỗi: "Cannot find module 'axios'"**

```bash
# Install lại
npm install axios form-data @vercel/node
vercel --prod
```

### **Lỗi: "Module not found: form-data"**

**Check:** `package.json` phải có:
```json
"dependencies": {
  "form-data": "^4.0.0"
}
```

**Fix:**
```bash
npm install form-data
vercel --prod
```

### **Lỗi vẫn 500 sau khi deploy**

**Check Function Logs:**
```
Vercel Dashboard → Project → Settings → Functions
→ Enable "Include source maps in log"
→ Deployments → Latest → Function Logs
```

**Common issues:**
- Network timeout → Increase function timeout (Settings → Functions)
- Memory limit → Increase memory (Settings → Functions)
- Import error → Check all imports có đúng

---

## 📊 SO SÁNH

### ❌ Before (Lỗi 500):
```
Request → Function starts → ❌ Crash
                           → Module not found
                           → FormData error
```

### ✅ After (OK):
```
Request → Function starts
       → Import axios, FormData ✅
       → Upload file ✅
       → Send webhook ✅
       → Return success ✅
```

---

## 💡 KEY FIXES

1. **Dependencies trong root `package.json`** ✅
   - Vercel chỉ install từ root
   - API folder không cần package.json riêng

2. **Use axios thay fetch** ✅
   - axios support FormData native
   - Dễ debug
   - Better error messages

3. **ES6 imports** ✅
   - `import` thay `require`
   - TypeScript compatible

---

## 🎯 CHECKLIST

- [ ] Dependencies trong root package.json
- [ ] Xóa api/package.json (không cần)
- [ ] Import axios, FormData đúng
- [ ] Replace fetch → axios
- [ ] Deployed: vercel --prod
- [ ] Build successful
- [ ] Function logs không có error
- [ ] Test upload CV work ✅

---

## 🎉 SUCCESS!

Sau khi fix:
- ✅ API function chạy ổn
- ✅ Upload file work
- ✅ File token returned
- ✅ Data saved to Lark Base
- ✅ File attached!

**Total time: 5 minutes**

---

## 📞 STILL NEED HELP?

**Check:**
1. Build logs trong Vercel
2. Function logs trong Vercel
3. Network tab trong browser (F12)
4. Console logs trong browser

**Common patterns:**
- 500 = Server error (function crash)
- 404 = Not found (routing issue)
- 405 = Method not allowed (GET vs POST)
- 401 = Auth failed (credentials)

---

**Last Updated:** 2026-02-05

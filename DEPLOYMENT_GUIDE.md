# 🚀 HR CV Formatter - File Upload Fixed

## Upload CV vào Lark Base với file đính kèm

---

## ✅ ĐÃ FIX

**Approach mới:** Upload file + data trong **1 request duy nhất** - giống Google Sheet

**Changes:**
- ✅ Thêm `/api/save-to-lark.ts` - Serverless function xử lý upload
- ✅ Thêm `larkUnifiedService.ts` - Service layer đơn giản
- ✅ Update `App.tsx` - Sử dụng service mới
- ✅ Update `types.ts` - Thêm appId, appSecret vào LarkConfig
- ✅ Update Settings UI - Thêm fields nhập App ID/Secret

---

## 📋 SETUP GUIDE

### Step 1: Install Dependencies

```bash
# Frontend dependencies (nếu chưa)
npm install

# Backend dependencies
cd api
npm install
cd ..
```

### Step 2: Get Lark Credentials

1. Vào: https://open.larksuite.com/app
2. Click vào app của bạn (hoặc create new)
3. **Enable Permission:**
   - Sidebar → Permissions & Scopes
   - Tìm: `drive:drive`
   - Toggle ON (màu xanh)
   - Click Save
4. **Publish App:**
   - Sidebar → Version Management
   - Create version → Publish
5. **Get Credentials:**
   - Sidebar → Credentials & Basic Info
   - Copy **App ID**: `cli_...`
   - Click Show → Copy **App Secret**

### Step 3: Deploy to Vercel

```bash
# Login
vercel login

# Deploy
vercel --prod
```

Vercel sẽ hỏi:
- Set up and deploy? → **Y**
- Link to existing? → **N**
- Project name? → **hr-cv-formatter** (hoặc tên bạn thích)
- Directory? → **Enter** (giữ ./)
- Modify settings? → **N**

Wait for build (~1-2 minutes)...

**Copy URL:** `https://your-project.vercel.app`

### Step 4: Config App

1. Mở app URL
2. Click Settings (⚙️)
3. Nhập:
   - **Webhook URL** (từ Lark Automation)
   - **App ID** ⭐ (từ step 2)
   - **App Secret** ⭐ (từ step 2)
4. Click "Lưu"

### Step 5: Setup Lark Base

1. Tạo fields trong Bitable:
   - `full_name` (Text)
   - `email` (Text)
   - `phone` (Text)
   - `cv_file_token` (**Attachment**) ⭐ QUAN TRỌNG
   - `upload_time` (DateTime)
   - ... (các field khác)

2. Create Automation:
   - Trigger: When webhook received
   - Action: Create record
   - Map fields:
     - `full_name` → `{{trigger.extracted_data.full_name}}`
     - `cv_file_token` → `{{trigger.extracted_data.cv_file_token}}`
     - ...
   - **Enable** automation

### Step 6: Test

1. Upload CV
2. Review data
3. Click "Xác nhận & Lưu Lark"
4. Check Lark Base
5. ✅ File attached!

---

## 🔄 WORKFLOW

```
User Upload CV
     ↓
AI Extract Data
     ↓
User Review & Click Save
     ↓
Frontend → /api/save-to-lark
     ↓
Backend:
  1. Upload file → Lark Drive
  2. Get file_token
  3. Send webhook (data + token)
     ↓
Lark Automation:
  1. Receive webhook
  2. Create record
  3. Attach file (via token)
     ↓
✅ DONE!
```

---

## 📁 FILE STRUCTURE

```
cvtohireteacher-main/
├── api/
│   ├── save-to-lark.ts      ← NEW: Serverless function
│   └── package.json          ← NEW: Dependencies
├── services/
│   ├── geminiService.ts
│   ├── larkService.ts
│   └── larkUnifiedService.ts ← NEW: Unified service
├── components/
│   ├── Header.tsx
│   ├── InputSection.tsx
│   └── ReviewSection.tsx
├── App.tsx                   ← UPDATED
├── types.ts                  ← UPDATED
├── vercel.json               ← NEW: Vercel config
└── package.json
```

---

## 🧪 TESTING

### Test API Endpoint

```bash
curl -X POST https://your-app.vercel.app/api/save-to-lark \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "cli_...",
    "appSecret": "...",
    "webhookUrl": "https://...",
    "extractedData": {
      "full_name": "Test User",
      "email": "test@example.com"
    },
    "fileData": {
      "name": "test.pdf",
      "mimeType": "application/pdf",
      "base64": "JVBERi0xLjQK..."
    }
  }'
```

Expected:
```json
{
  "success": true,
  "file_token": "boxcn...",
  "message": "Data saved successfully"
}
```

### Test Full Flow

1. Go to app
2. Upload CV
3. Extract
4. Review
5. Save
6. Check console:
   ```
   Preparing file: John_Doe_CV.pdf
   Calling /api/save-to-lark...
   ✅ Saved successfully!
   📎 File token: boxcnABC123...
   ```
7. Check Lark Base
8. ✅ File attached!

---

## 🐛 TROUBLESHOOTING

### ❌ "Failed to get access token"

**Fix:**
- Check App ID/Secret đúng chưa
- Check app đã publish chưa
- Re-enter credentials trong Settings

### ❌ "Failed to upload file"

**Fix:**
- Check permission `drive:drive` đã bật chưa
- Check file size < 10MB
- Check file format hỗ trợ (PDF, DOCX, PNG, JPG)

### ❌ File không hiện trong Lark Base

**Fix:**
- Check field `cv_file_token` có type **Attachment** không
- Check field mapping trong Automation
- Re-test với CV mới

### ❌ "API route not found"

**Fix:**
- Check `/api` folder có đúng structure không
- Re-deploy: `vercel --prod`
- Check vercel.json config

---

## 🎯 ADVANTAGES

### So với approach cũ:

| Feature | Old | New |
|---------|-----|-----|
| Requests | 2 (upload + webhook) | **1** ✅ |
| Code complexity | High | **Low** ✅ |
| File attachment | ❌ No | **✅ Yes** |
| Error handling | Limited | **Full** ✅ |
| Similar to GSheet | No | **Yes** ✅ |

---

## 📝 NOTES

- **File size limit:** 10MB (Vercel limit)
- **App ID/Secret** required cho file upload
- **Webhook URL** vẫn cần cho data sync
- **CORS-free** vì xử lý trên backend

---

## ✅ CHECKLIST

Deploy checklist:

- [ ] Đã install dependencies: `npm install`
- [ ] Đã install API dependencies: `cd api && npm install`
- [ ] Đã get Lark App ID & Secret
- [ ] Đã enable permission `drive:drive`
- [ ] Đã publish app
- [ ] Đã deploy: `vercel --prod`
- [ ] Đã config App ID/Secret trong Settings
- [ ] Đã setup Lark Base fields
- [ ] Đã create Automation
- [ ] Đã test upload
- [ ] File hiện trong Lark Base ✅

---

## 🎉 SUCCESS!

Giờ bạn có thể upload CV và file tự động đính kèm vào Lark Base!

**Developer:** Anh Nguyễn  
**Last Updated:** 2026-02-05

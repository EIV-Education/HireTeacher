# 🔧 FIX LỖI 404 - VERCEL DEPLOYMENT

## Lỗi bạn gặp phải

```
HTTP 404: The page could not be found
NOT_FOUND
```

---

## 🎯 NGUYÊN NHÂN

Project này là **static site** (không cần build) nhưng Vercel config chưa đúng.

---

## ✅ GIẢI PHÁP - 3 CÁCH

### **CÁCH 1: Deploy lại với config đúng (Nhanh nhất)**

```bash
# 1. Xóa project cũ trên Vercel
# Vào https://vercel.com/dashboard
# Click vào project → Settings → Delete Project

# 2. Deploy lại từ đầu
cd cvtohireteacher-main
vercel --prod

# Khi được hỏi:
# - Framework? → Other
# - Build Command? → (để trống, Enter)
# - Output Directory? → ./ (thư mục hiện tại)
# - Development Command? → (để trống, Enter)
```

**Done!** App sẽ chạy ngay.

---

### **CÁCH 2: Fix qua Vercel Dashboard**

1. **Vào project settings:**
   - https://vercel.com/dashboard
   - Click vào project `hire-teacher`
   - Settings → General

2. **Sửa config:**
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: (leave empty)
   Output Directory: ./
   Install Command: npm install
   ```

3. **Save changes**

4. **Redeploy:**
   - Deployments tab
   - Click ... ở deployment mới nhất
   - Click "Redeploy"
   - Wait 1-2 minutes

---

### **CÁCH 3: Fix code và push lại**

**File đã fix:** `vercel.json`

**Config mới:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

**Deploy:**
```bash
# 1. Copy file vercel.json mới vào project
# 2. Deploy
cd cvtohireteacher-main
vercel --prod
```

---

## 🧪 KIỂM TRA SAU KHI FIX

1. **Vào URL app:**
   ```
   https://hire-teacher.vercel.app
   ```

2. **Phải thấy:**
   - ✅ Giao diện app hiện ra
   - ✅ Upload CV button
   - ✅ Settings icon
   - ✅ Logo EIV

3. **Test API endpoint:**
   ```
   https://hire-teacher.vercel.app/api/save-to-lark
   ```
   
   Phải return:
   ```
   Method not allowed (OK - vì chưa POST)
   ```

---

## 🐛 NẾU VẪN LỖI

### **Lỗi: "Build failed"**

**Fix:**
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Deploy lại
vercel --prod
```

### **Lỗi: "API route not found"**

**Check:**
1. Folder `/api` có trong project không?
2. File `/api/save-to-lark.ts` tồn tại không?
3. File `/api/package.json` có dependencies không?

**Fix:**
```bash
# Install API dependencies
cd api
npm install
cd ..

# Deploy
vercel --prod
```

### **Lỗi: "Invalid vercel.json"**

**Fix:**
```bash
# Validate JSON
cat vercel.json | jq .

# Nếu lỗi syntax, fix format:
# - Kiểm tra dấu phẩy
# - Kiểm tra dấu ngoặc
# - Kiểm tra quotes
```

---

## 📁 CẤU TRÚC PROJECT ĐÚNG

```
cvtohireteacher-main/
├── api/
│   ├── save-to-lark.ts       ← API endpoint
│   └── package.json          ← API dependencies
├── components/               ← React components
├── services/                 ← Services
├── public/                   ← Static assets
├── index.html               ← Entry point ⭐
├── index.tsx                ← React app
├── App.tsx                  ← Main component
├── package.json             ← Frontend dependencies
├── vercel.json              ← Vercel config ⭐
└── .vercelignore            ← Ignore files
```

---

## 🎯 CONFIG ĐỂ APP CHẠY

### **1. Frontend (Static):**
- Serve `index.html` ở root
- Load React components via ESM imports
- Không cần build step

### **2. Backend (Serverless):**
- API routes trong `/api` folder
- Auto-detect TypeScript
- Node.js runtime

### **3. Routing:**
- `/` → `index.html`
- `/api/*` → Serverless functions

---

## 💡 TIPS

### **Tip 1: Check build logs**
```
Vercel Dashboard → Deployments → Click vào deployment
→ Xem "Build Logs" để biết lỗi gì
```

### **Tip 2: Test locally**
```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Open: http://localhost:3000
```

### **Tip 3: Environment variables**
Nếu dùng env vars:
```
Vercel Dashboard → Settings → Environment Variables
→ Add: VITE_GEMINI_API_KEY, etc.
→ Redeploy
```

---

## ✅ CHECKLIST DEPLOY THÀNH CÔNG

- [ ] Vercel config đúng (Framework: Other)
- [ ] index.html ở root
- [ ] /api folder có save-to-lark.ts
- [ ] vercel.json syntax đúng
- [ ] Build successful (no errors)
- [ ] App URL mở được
- [ ] Upload CV test OK
- [ ] Settings mở được
- [ ] API endpoint responding

---

## 🎉 SUCCESS!

Sau khi fix xong:
1. App chạy: `https://hire-teacher.vercel.app`
2. Upload CV work ✅
3. Lark integration work ✅
4. File attachment work ✅

**Total time:** 5-10 minutes

---

## 📞 NEED MORE HELP?

**Common issues:**
1. 404 → Framework config sai
2. Build failed → Dependencies missing
3. API 404 → API folder missing
4. CORS → API config sai

**Debug steps:**
1. Check build logs
2. Test locally: `vercel dev`
3. Verify file structure
4. Check vercel.json syntax

---

**Last Updated:** 2026-02-05

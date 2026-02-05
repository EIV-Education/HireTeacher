# 📎 Hướng dẫn Setup File Attachment cho Lark Base

## ✅ Tính năng mới đã thêm

**CV gốc (PDF/DOCX/Image) giờ đây được đính kèm trực tiếp vào Lark Base record** thay vì chỉ gửi Base64.

---

## 🔧 Setup Lark App để Upload File

### Bước 1: Tạo Lark App

1. Truy cập [Lark Developer Console](https://open.larksuite.com/app)
2. Click **"Create custom app"**
3. Đặt tên app: `EIV HR CV Processor`
4. Chọn workspace của bạn

### Bước 2: Cấp Quyền (Permissions)

Vào tab **"Permissions & Scopes"**, bật các quyền sau:

- ✅ `drive:drive` - **Required** để upload file lên Lark Drive
- ✅ `bitable:app` - Để tương tác với Bitable (optional, nếu cần đọc/ghi trực tiếp)

Click **"Save"** và **"Publish Version"**

### Bước 3: Lấy Credentials

1. Vào tab **"Credentials & Basic Info"**
2. Copy:
   - **App ID**: `cli_a1b2c3d4e5f6...`
   - **App Secret**: `••••••••••••••••`

### Bước 4: Cấu hình Automation Webhook

1. Mở Lark Base table của bạn
2. Vào **Automation** → **Create Automation**
3. **Trigger**: When webhook received
4. Copy **Webhook URL**: `https://eiveducation.sg.larksuite.com/base/automation/webhook/event/...`

### Bước 5: Map Fields trong Automation

Trong automation action **"Create Record"**, map các fields:

```json
{
  "full_name": "{{trigger.extracted_data.full_name}}",
  "email": "{{trigger.extracted_data.email}}",
  "phone": "{{trigger.extracted_data.phone}}",
  "cv_file_name": "{{trigger.extracted_data.cv_file_name}}",
  "cv_file_token": "{{trigger.extracted_data.cv_file_token}}", 
  "upload_time": "{{trigger.extracted_data.upload_time}}"
}
```

**⚠️ QUAN TRỌNG:**  
- Field `cv_file_token` cần có kiểu **Attachment** trong Bitable schema
- Lark sẽ tự động convert `file_token` thành file attachment

---

## 🎯 Cách sử dụng trong App

### 1. Vào Settings (⚙️)

### 2. Nhập thông tin Lark:
- **Webhook URL**: `https://...`
- **App ID**: `cli_...`
- **App Secret**: `•••...`

### 3. Test Webhook
Click **"KIỂM TRA WEBHOOK"** để gửi sample data

### 4. Upload CV và Process
- Upload file CV → AI trích xuất → Review → Gửi lên Lark
- File gốc tự động được đính kèm vào record

---

## 🔍 Kiểm tra Logs

Nếu file không upload được, mở **Console (F12)** và xem:

```
Lark Token Error: {...}  // Lỗi khi lấy access token
Lark Upload Error: {...}  // Lỗi khi upload file
Webhook Send Error: {...} // Lỗi khi gửi webhook
```

**Các lỗi thường gặp:**

| Lỗi | Nguyên nhân | Giải pháp |
|------|-------------|-----------|
| `code: 99991663` | App ID/Secret sai | Kiểm tra lại credentials |
| `code: 99991668` | Không có quyền `drive:drive` | Bật permission và publish lại app |
| `File upload failed` | File quá lớn (>20MB) | Giảm kích thước file |

---

## 🚀 Flow hoạt động

1. **User upload CV** → Convert sang Base64
2. **AI trích xuất data** → Parsed JSON
3. **User xác nhận** → Click "Gửi lên Lark"
4. **System upload file:**
   - Lấy `tenant_access_token` từ App ID/Secret
   - Upload file lên Lark Drive
   - Nhận `file_token`
5. **System gửi webhook:**
   - Data + `cv_file_token`
   - Automation tự động tạo record với attachment

---

## 📌 Lưu ý

- File attachment chỉ hoạt động khi có **App ID + App Secret**
- Nếu không có credentials, app vẫn gửi được data nhưng **không có file đính kèm**
- File tối đa **20MB** (giới hạn của Lark API)
- Supported file types: PDF, DOCX, PNG, JPG, JPEG

---

## 🆘 Hỗ trợ

Nếu gặp vấn đề, contact:
- **Developer**: Anh Nguyễn (EIV Education IT Team)
- **Lark Docs**: https://open.larksuite.com/document/server-docs/docs/drive-v1/upload

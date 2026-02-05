// ============================================
// LARK SERVICE - FILE UPLOAD & WEBHOOK
// ============================================

interface LarkTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
}

interface LarkFileUploadResponse {
  code: number;
  msg: string;
  data?: {
    file_token: string;
  };
}

/**
 * Lấy tenant access token từ Lark Open API
 */
export async function getLarkAccessToken(
  appId: string,
  appSecret: string
): Promise<string | null> {
  try {
    const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const result: LarkTokenResponse = await response.json();
    
    if (result.code === 0 && result.tenant_access_token) {
      return result.tenant_access_token;
    }
    
    console.error('Lark Token Error:', result);
    return null;
  } catch (error) {
    console.error('Get Token Failed:', error);
    return null;
  }
}

/**
 * Upload file lên Lark và trả về file_token
 */
export async function uploadFileToLark(
  file: { name: string; type: string; data: string },
  accessToken: string
): Promise<string | null> {
  try {
    // Convert Base64 to Blob
    const base64Data = file.data.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: file.type });

    // Tạo FormData
    const formData = new FormData();
    formData.append('file', blob, file.name);
    formData.append('file_type', 'stream'); // hoặc 'pdf', 'doc' tùy loại file

    const response = await fetch('https://open.larksuite.com/open-apis/drive/v1/medias/upload_all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    const result: LarkFileUploadResponse = await response.json();
    
    if (result.code === 0 && result.data?.file_token) {
      return result.data.file_token;
    }
    
    console.error('Lark Upload Error:', result);
    return null;
  } catch (error) {
    console.error('Upload File Failed:', error);
    return null;
  }
}

/**
 * Gửi dữ liệu + file_token lên Lark Base qua webhook
 */
export async function sendToLarkWebhook(
  webhookUrl: string,
  data: any,
  fileToken: string | null,
  fileName: string,
  isTest: boolean = false
): Promise<boolean> {
  try {
    const fieldsWithFile = {
      ...data,
      "cv_file_name": fileName || "N/A",
      "cv_file_token": fileToken || "", // File token để Lark Base tạo attachment
      "upload_time": new Date().toLocaleString('vi-VN')
    };

    const payload = {
      msg_type: "text",
      content: {
        text: JSON.stringify({
          source: "EIV HR CV Formatter",
          is_test: isTest,
          extracted_data: fieldsWithFile,
          timestamp: new Date().toLocaleString('vi-VN')
        }, null, 2)
      },
      record: {
        fields: fieldsWithFile
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    return true;
  } catch (error) {
    console.error('Webhook Send Error:', error);
    return false;
  }
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      appId, 
      appSecret, 
      webhookUrl,
      extractedData,
      fileData  // { name, mimeType, base64 }
    } = req.body;

    console.log('Processing request...');
    console.log('Has file:', !!fileData);

    // ========== STEP 1: Upload file nếu có ==========
    let fileToken: string | null = null;
    
    if (fileData && fileData.base64) {
      console.log('Uploading file to Lark Drive...');
      
      // 1.1. Get access token
      const authResponse = await axios.post(
        'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
        {
          app_id: appId,
          app_secret: appSecret
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const authData = authResponse.data;
      
      if (authData.code !== 0) {
        throw new Error(`Failed to get access token: ${authData.msg}`);
      }

      const accessToken = authData.tenant_access_token;
      console.log('Access token obtained');

      // 1.2. Convert Base64 to Buffer
      const base64Content = fileData.base64.includes('base64,') 
        ? fileData.base64.split('base64,')[1] 
        : fileData.base64;
      
      const buffer = Buffer.from(base64Content, 'base64');
      console.log('File size:', buffer.length, 'bytes');

      // 1.3. Create FormData
      const formData = new FormData();
      formData.append('file_name', fileData.name);
      formData.append('parent_type', 'explorer');
      formData.append('parent_node', 'root');
      formData.append('size', buffer.length.toString());
      formData.append('file', buffer, {
        filename: fileData.name,
        contentType: fileData.mimeType
      });

      // 1.4. Upload file with axios
      const uploadResponse = await axios.post(
        'https://open.larksuite.com/open-apis/drive/v1/medias/upload_all',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...formData.getHeaders()
          }
        }
      );

      const uploadData = uploadResponse.data;

      if (uploadData.code !== 0) {
        throw new Error(`Failed to upload file: ${uploadData.msg}`);
      }

      fileToken = uploadData.data.file_token;
      console.log('File uploaded successfully:', fileToken);
    }

    // ========== STEP 2: Send data + file_token to webhook ==========
    const webhookPayload = {
      msg_type: "text",
      content: {
        text: JSON.stringify({
          source: "EIV HR CV Formatter",
          extracted_data: {
            ...extractedData,
            cv_file_token: fileToken || 'N/A',
            cv_file_name: fileData?.name || 'N/A',
            upload_time: new Date().toLocaleString('vi-VN')
          },
          timestamp: new Date().toLocaleString('vi-VN')
        }, null, 2)
      }
    };

    console.log('Sending webhook...');
    await axios.post(webhookUrl, webhookPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Webhook sent successfully');

    // ========== STEP 3: Return success ==========
    return res.status(200).json({
      success: true,
      file_token: fileToken,
      message: 'Data saved successfully'
    });

  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
}

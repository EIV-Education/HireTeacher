interface LarkConfig {
  appId: string;
  appSecret: string;
  webhookUrl: string;
}

interface FileData {
  name: string;
  mimeType: string;
  base64: string;
}

/**
 * Gửi data + file lên Lark Base trong 1 request duy nhất
 * Giống như cách Google Sheet hoạt động
 */
export async function saveToLark(
  config: LarkConfig,
  extractedData: any,
  fileData?: FileData
): Promise<{ success: boolean; file_token?: string; error?: string }> {
  
  try {
    console.log('Calling /api/save-to-lark...');
    
    const response = await fetch('/api/save-to-lark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appId: config.appId,
        appSecret: config.appSecret,
        webhookUrl: config.webhookUrl,
        extractedData: extractedData,
        fileData: fileData  // Có thể undefined nếu không có file
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('API response:', result);
    
    return result;

  } catch (error: any) {
    console.error('Error saving to Lark:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


import { GoogleGenAI } from "@google/genai";
import { UploadedFile } from "../types";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

// MIME types supported by Gemini API for inlineData
const SUPPORTED_AI_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

const processCV = async (
  instructions: string, 
  cvText: string, 
  cvFile: UploadedFile | null,
  retryCount = 1
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `Bạn là chuyên gia Tuyển dụng HR. Nhiệm vụ: đọc CV và trích xuất thông tin vào định dạng JSON chính xác.

NGUYÊN TẮC BẮT BUỘC:
1. Trả về JSON OBJECT THUẦN TÚY, không có markdown, không có giải thích.
2. Nếu không tìm thấy thông tin → để chuỗi rỗng "" (TUYỆT ĐỐI không dùng "N/A").
3. Với các trường có mapping cố định (university, class_type, branch, candidate_type): PHẢI chọn đúng từ danh sách quy định, dù CV viết theo cách khác.
4. Trường [university]: chọn bằng cấp CAO NHẤT. Ví dụ: "Bachelor of Chemistry" → "Bachelor's Degree", "Cử nhân Sư phạm" → "Bachelor's Degree", cao đẳng → "Associate's Degree".
5. Trường [cv_source]: luôn để "" vì không thể biết từ CV.
6. Trường [certificates]: ghi tên chuẩn (IELTS, TOEIC, TEFL, CELTA, TESOL, DELTA) kèm điểm số nếu có.`;

  const userPrompt = `
    YÊU CẦU ĐỊNH DẠNG:
    ${instructions}
    
    DỮ LIỆU CV (VĂN BẢN):
    ${cvText || "(Phân tích từ file đính kèm bên dưới)"}
    
    ${cvFile?.extractedText ? `
    TEXT TỪ FILE WORD (ĐÃ TRÍCH XUẤT):
    ${cvFile.extractedText.substring(0, 10000)}
    ` : ''}
  `;

  const parts: any[] = [{ text: userPrompt }];

  // CRITICAL FIX: Only send file as binary if it's a supported type (PDF or Image)
  // Word files (.docx) are NOT supported as inlineData and cause a 400 error.
  // We rely on the extractedText passed in the prompt for Word files.
  if (cvFile && SUPPORTED_AI_MIMES.includes(cvFile.type)) {
    const base64Data = cvFile.data.split(',')[1]; 
    parts.unshift({
      inlineData: {
        data: base64Data,
        mimeType: cvFile.type
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const result = response.text;
    if (!result) throw new Error("AI không thể trích xuất được thông tin từ hồ sơ này.");
    return result;

  } catch (error: any) {
    // Handle specific API errors
    if (error.message?.includes('Unsupported MIME type')) {
      throw new Error("Định dạng tệp này không được AI hỗ trợ đọc trực tiếp. Hệ thống đã cố gắng trích xuất văn bản, vui lòng kiểm tra lại nội dung.");
    }

    if (retryCount > 0 && !error.message?.includes('401') && !error.message?.includes('400')) {
      await wait(2000);
      return processCV(instructions, cvText, cvFile, retryCount - 1);
    }
    throw new Error(error.message || "Lỗi kết nối AI.");
  }
};

export { processCV };

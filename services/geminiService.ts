
import { GoogleGenAI } from "@google/genai";
import { UploadedFile } from "../types";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

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

  const systemInstruction = "Bạn là chuyên gia Tuyển dụng. Nhiệm vụ của bạn là đọc CV và trích xuất thông tin cực kỳ chính xác vào định dạng JSON. Hãy tập trung vào việc tóm tắt kinh nghiệm một cách chuyên nghiệp nhất cho báo cáo nội bộ.";

  const userPrompt = `
    YÊU CẦU ĐỊNH DẠNG:
    ${instructions}
    
    DỮ LIỆU CV:
    ${cvText || "(Phân tích từ file đính kèm bên dưới)"}
  `;

  const parts: any[] = [{ text: userPrompt }];

  if (cvFile) {
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
    if (!result) throw new Error("AI không thể đọc được file này.");
    return result;

  } catch (error: any) {
    if (retryCount > 0 && !error.message?.includes('401')) {
      await wait(2000);
      return processCV(instructions, cvText, cvFile, retryCount - 1);
    }
    throw new Error(error.message || "Lỗi kết nối AI.");
  }
};

export { processCV };

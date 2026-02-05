
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ReviewSection from './components/ReviewSection';
import { InputMode, ProcessingStatus, UploadedFile, LarkConfig } from './types';
import { processCV } from './services/geminiService';
import { saveToLark } from './services/larkUnifiedService';
import { Settings as SettingsIcon, Save, X, RefreshCcw, Info, Database, FileCode, Play, CheckCircle2, Paperclip } from 'lucide-react';

const DEFAULT_WEBHOOK_URL = "https://eiveducation.sg.larksuite.com/base/automation/webhook/event/XczYac0jswZYWehHEcXlXJJQgmc";

const INITIAL_TEMPLATE = `TRÍCH XUẤT THÔNG TIN VÀ TRẢ VỀ DẠNG JSON OBJECT:
{
  "full_name": "Nguyễn Văn A",
  "gender": "Male/Female",
  "nationality": "Việt Nam",
  "address": "Quận 1, TP.HCM",
  "birth_year": "1995",
  "email": "nguyenvana@email.com",
  "phone": "0901234567",
  "university": "Bachelor’s Degree, Associate’s Degree, Master’s Degree, Doctorate (PhD)",
  "certificates": "IELTS 7.5,TEFL,CELTA,TESOL,TOEIC 900+",
  "experience_summary": "Tóm tắt kinh nghiệm làm việc chuyên môn.",
  "class_type": "Kindergarten / Preschool, Primary School, Secondary School, High School, Language Center, Online...",
  "branch": "HO CHI MINH / HA NOI / DA NANG",
  "cv_source": "Facebook / LinkedIn / Website / Vietnamteachingjobs / Group Zalo / Outsource / Refferal from a friend/ Other/ ...",
  "candidate_type": "School during daytime (full-time) / Private classes/Centers during evenings and weekends (part-time)"
}
Lưu ý: Nếu thiếu thông tin ghi "N/A"`;

function App() {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.FILE);
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  
  // Settings States
  const [larkConfig, setLarkConfig] = useState<LarkConfig>(() => {
    const saved = localStorage.getItem('lark_config');
    return saved ? JSON.parse(saved) : { webhookUrl: DEFAULT_WEBHOOK_URL, enabled: true };
  });

  const [extractionTemplate, setExtractionTemplate] = useState<string>(() => {
    const saved = localStorage.getItem('extraction_template');
    return saved || INITIAL_TEMPLATE;
  });

  useEffect(() => {
    localStorage.setItem('lark_config', JSON.stringify(larkConfig));
  }, [larkConfig]);

  useEffect(() => {
    localStorage.setItem('extraction_template', extractionTemplate);
  }, [extractionTemplate]);

  const handleResetTemplate = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục mẫu trích xuất về mặc định?")) {
      setExtractionTemplate(INITIAL_TEMPLATE);
    }
  };

  const sendToLark = async (data: any, file: UploadedFile | null, isTest: boolean = false) => {
    if (!larkConfig.webhookUrl) return;

    const fieldsWithFile = {
      ...data,
      "file_attachment_name": file ? file.name : (isTest ? "Sample_CV.pdf" : "N/A"),
      "file_content_base64": file ? file.data.split(',')[1] : (isTest ? "VGVzdCBkYXRh" : ""), 
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

    try {
      await fetch(larkConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (err) {
      console.error("Lark Storage Error:", err);
      return false;
    }
  };

  const handleSendSample = async () => {
    if (!larkConfig.webhookUrl) {
      alert("Vui lòng nhập Webhook URL trước.");
      return;
    }
    setIsTestingWebhook(true);
    setTestSuccess(false);
    try {
      let sampleData = {};
      try {
        const jsonMatch = extractionTemplate.match(/\{[\s\S]*\}/);
        sampleData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch (e) {
        sampleData = { "info": "Mẫu không hợp lệ", "full_name": "Nguyễn Văn Test", "gender": "Male" };
      }
      await sendToLark(sampleData, null, true);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (error) {
      alert("Lỗi khi gửi mẫu thử.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleProcess = async () => {
    if (!larkConfig.webhookUrl) {
      alert("Vui lòng cấu hình Webhook Lark Base trong phần Cài đặt.");
      setIsSettingsOpen(true);
      return;
    }
    setStatus(ProcessingStatus.PROCESSING);
    try {
      const result = await processCV(extractionTemplate, cvText, cvFile);
      let parsedData;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        throw new Error("AI không thể tạo đúng cấu hình JSON. Hãy kiểm tra lại phần 'Mẫu trích xuất'.");
      }
      if (!parsedData) throw new Error("Không thể trích xuất dữ liệu từ CV.");
      setExtractedData(parsedData);
      setStatus(ProcessingStatus.REVIEW);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleConfirmAndSend = async () => {
    setStatus(ProcessingStatus.SENDING);
    
    try {
      // Validate required config
      if (!larkConfig.appId || !larkConfig.appSecret) {
        alert('⚠️ Vui lòng cấu hình App ID và App Secret trong Settings để upload file CV.');
        setIsSettingsOpen(true);
        setStatus(ProcessingStatus.REVIEW);
        return;
      }

      // Prepare file data nếu có
      let fileData = undefined;
      
      if (cvFile && cvFile.data) {
        console.log('Preparing file:', cvFile.name);
        const base64Content = cvFile.data.includes('base64,')
          ? cvFile.data.split('base64,')[1]
          : cvFile.data;
        
        fileData = {
          name: cvFile.name,
          mimeType: cvFile.type,
          base64: base64Content
        };
      }

      // ========== GỌI 1 FUNCTION DUY NHẤT - Giống Google Sheet ==========
      console.log('Saving to Lark Base...');
      const result = await saveToLark(
        {
          appId: larkConfig.appId,
          appSecret: larkConfig.appSecret,
          webhookUrl: larkConfig.webhookUrl
        },
        extractedData,  // Data đã extract
        fileData        // File data (optional)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save to Lark');
      }

      console.log('✅ Saved successfully!');
      if (result.file_token) {
        console.log('📎 File token:', result.file_token);
      }

      setStatus(ProcessingStatus.SUCCESS);
      
      setTimeout(() => {
        setCvFile(null);
        setCvText('');
        setExtractedData(null);
        setStatus(ProcessingStatus.IDLE);
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Lỗi khi lưu: ${error.message}`);
      setStatus(ProcessingStatus.REVIEW);
    }
  };

  const handleCancelReview = () => {
    setExtractedData(null);
    setStatus(ProcessingStatus.IDLE);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe] text-gray-900 font-['Inter'] overflow-hidden">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="flex-1 w-full mx-auto px-4 py-8 flex justify-center items-start">
        <div className={`w-full transition-all duration-700 ${
          status === ProcessingStatus.REVIEW || status === ProcessingStatus.SENDING || (status === ProcessingStatus.SUCCESS && extractedData)
            ? 'max-w-7xl' 
            : 'max-w-xl'
        }`}>
            {status === ProcessingStatus.REVIEW || status === ProcessingStatus.SENDING || (status === ProcessingStatus.SUCCESS && extractedData) ? (
              <ReviewSection 
                data={extractedData}
                setData={setExtractedData}
                onConfirm={handleConfirmAndSend}
                onCancel={handleCancelReview}
                isSending={status === ProcessingStatus.SENDING}
              />
            ) : (
              <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <InputSection 
                  inputMode={inputMode}
                  setInputMode={setInputMode}
                  cvText={cvText}
                  setCvText={setCvText}
                  cvFile={cvFile}
                  setCvFile={setCvFile}
                  onProcess={handleProcess}
                  isProcessing={status === ProcessingStatus.PROCESSING}
                  status={status}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 flex items-center gap-2">
                      <Database className="w-3 h-3 text-[#f58220]" /> Lark Sync
                    </h3>
                    <p className="text-xs font-bold text-gray-600 truncate">
                      {larkConfig.webhookUrl ? "Sẵn sàng (Bitable)" : "Chưa cấu hình"}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-[#f58220]" /> Powered by IT EIV 
                    </h3>
                    <p className="text-xs font-bold text-gray-600">ANH NGUYỄN</p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f9fafb]">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <SettingsIcon className="w-5 h-5 text-[#f58220]" /> Cấu hình HR Formatter
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#fdf2e9] p-2 rounded-xl text-[#f58220]"><Database className="w-4 h-4" /></div>
                    <h3 className="font-bold text-sm text-gray-800">Kết nối Lark Base (Bitable)</h3>
                  </div>
                  {larkConfig.webhookUrl && (
                    <button onClick={handleSendSample} disabled={isTestingWebhook} className="bg-orange-50 text-[#f58220] hover:bg-orange-100 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                      KIỂM TRA WEBHOOK
                    </button>
                  )}
                </div>
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Webhook URL (Automation)</label>
                    <input type="text" value={larkConfig.webhookUrl} onChange={(e) => setLarkConfig({...larkConfig, webhookUrl: e.target.value})} placeholder="https://open.larksuite.com/..." className="w-full p-4 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-50 focus:border-[#f58220] outline-none shadow-sm transition-all" />
                  </div>
                  
                  {/* ========== THÊM MỚI: App ID & App Secret ========== */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                      App ID (cho file upload) ⭐
                    </label>
                    <input 
                      type="text" 
                      value={larkConfig.appId || ''} 
                      onChange={(e) => setLarkConfig({...larkConfig, appId: e.target.value})} 
                      placeholder="cli_a1b2c3d4e5f6g7h8" 
                      className="w-full p-4 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-50 focus:border-[#f58220] outline-none shadow-sm transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                      App Secret (cho file upload) ⭐
                    </label>
                    <input 
                      type="password" 
                      value={larkConfig.appSecret || ''} 
                      onChange={(e) => setLarkConfig({...larkConfig, appSecret: e.target.value})} 
                      placeholder="••••••••••••••••" 
                      className="w-full p-4 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-50 focus:border-[#f58220] outline-none shadow-sm transition-all" 
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-800 leading-relaxed">
                      <strong>App ID & App Secret</strong> cần thiết để upload file CV lên Lark Drive. Lấy từ <a href="https://open.larksuite.com/app" target="_blank" rel="noopener noreferrer" className="underline font-bold">Lark Developer Console</a> → App của bạn → Credentials & Basic Info
                    </p>
                  </div>
                </div>
              </section>
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#fdf2e9] p-2 rounded-xl text-[#f58220]"><FileCode className="w-4 h-4" /></div>
                    <h3 className="font-bold text-sm text-gray-800">Mẫu trích xuất (AI Logic)</h3>
                  </div>
                  <button onClick={handleResetTemplate} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#f58220] transition-colors"><RefreshCcw className="w-3 h-3" /> KHÔI PHỤC MẶC ĐỊNH</button>
                </div>
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                  <textarea value={extractionTemplate} onChange={(e) => setExtractionTemplate(e.target.value)} className="w-full h-72 p-5 text-xs font-mono border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-50 focus:border-[#f58220] outline-none resize-none bg-white transition-all" />
                </div>
              </section>
            </div>
            <div className="p-6 bg-[#f9fafb] border-t border-gray-100">
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-[#f58220] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#e67300] shadow-xl shadow-[#f58220]/20 active:scale-95"><Save className="w-5 h-5" /> Lưu toàn bộ thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

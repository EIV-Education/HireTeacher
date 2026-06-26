
import React, { useRef, useState } from 'react';
import { Upload, Type, X, File as FileIcon, Check, Send, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { InputMode, UploadedFile, ProcessingStatus } from '../types';

interface InputSectionProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  cvText: string;
  setCvText: (text: string) => void;
  cvFile: UploadedFile | null;
  setCvFile: (file: UploadedFile | null) => void;
  onProcess: () => void;
  isProcessing: boolean;
  status: ProcessingStatus;
  onFileUpload?: (file: File) => Promise<UploadedFile | null>;
  supportedFileTypes?: string;
  maxFileSize?: number;
}

const InputSection: React.FC<InputSectionProps> = ({
  inputMode,
  setInputMode,
  cvText,
  setCvText,
  cvFile,
  setCvFile,
  onProcess,
  isProcessing,
  status,
  onFileUpload,
  supportedFileTypes = '.pdf, .doc, .docx, .jpg, .jpeg, .png, .webp',
  maxFileSize = 10485760 // 10MB
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (file.size > maxFileSize) {
      alert("File quá lớn (tối đa 10MB).");
      return;
    }
    
    if (onFileUpload) {
      const uploaded = await onFileUpload(file);
      if (uploaded) setCvFile(uploaded);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCvFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-10 h-10 text-blue-500" />;
    if (fileName.endsWith('.pdf')) return <FileIcon className="w-10 h-10 text-red-500" />;
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return <FileIcon className="w-10 h-10 text-blue-700" />;
    return <FileIcon className="w-10 h-10 text-gray-400" />;
  };

  const handleRemoveFile = () => {
    setCvFile(null);
    setCvText('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 bg-[#f9fafb] flex justify-between items-center">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#f58220]" /> Hồ Sơ Ứng Viên
        </h2>
        {status === ProcessingStatus.ERROR && (
           <div className="flex items-center text-red-500 text-[11px] font-bold bg-red-50 px-3 py-1 rounded-full animate-pulse">
             <AlertTriangle className="w-3 h-3 mr-1" /> Lỗi phân tích
           </div>
        )}
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => setInputMode(InputMode.FILE)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm rounded-lg transition-all ${
              inputMode === InputMode.FILE ? 'bg-white text-[#f58220] shadow-sm font-bold border border-gray-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" /> <span>Tải File CV</span>
          </button>
          <button
            onClick={() => setInputMode(InputMode.TEXT)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm rounded-lg transition-all ${
              inputMode === InputMode.TEXT ? 'bg-white text-[#f58220] shadow-sm font-bold border border-gray-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Type className="w-4 h-4" /> <span>Dán nội dung</span>
          </button>
        </div>

        {inputMode === InputMode.FILE ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
            className={`group border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col justify-center items-center h-64 overflow-hidden ${
              isDragging ? 'border-[#f58220] bg-orange-50' : 'border-gray-200 hover:border-[#f58220] hover:bg-orange-50/30'
            }`}
          >
            {cvFile ? (
              <div className="animate-in fade-in zoom-in duration-300 space-y-4 w-full h-full flex flex-col items-center justify-center">
                <div className="relative group/file w-full max-w-[200px]">
                  {cvFile.type.startsWith('image/') ? (
                    <div className="relative aspect-[3/4] w-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-md">
                      <img src={cvFile.data} alt="CV Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10 group-hover/file:bg-black/20 transition-colors"></div>
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center">
                      {getFileIcon(cvFile.name, cvFile.type)}
                      <p className="mt-2 text-xs font-bold text-gray-500 uppercase">{cvFile.name.split('.').pop()}</p>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center px-4">
                  <p className="font-bold text-gray-800 truncate text-sm max-w-[240px]">
                    {cvFile.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                    Sẵn sàng trích xuất dữ liệu
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-100 p-4 rounded-2xl mb-4 group-hover:bg-orange-100 transition-colors">
                  <div className="flex gap-2">
                     <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#f58220]' : 'text-gray-400 group-hover:text-[#f58220]'}`} />
                     <ImageIcon className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#f58220]' : 'text-gray-400 group-hover:text-[#f58220]'}`} />
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-700">Kéo thả hoặc Click để tải CV</p>
                <p className="text-[11px] text-gray-400 mt-2 uppercase tracking-wide">PDF, Word, JPG, PNG (Tối đa 10MB)</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept={supportedFileTypes}
            />
          </div>
        ) : (
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Dán toàn bộ nội dung CV vào đây..."
            className="w-full h-64 p-5 text-sm border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-[#f58220] outline-none resize-none transition-all shadow-inner bg-gray-50/30"
          />
        )}
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <button
          onClick={onProcess}
          disabled={isProcessing || (!cvFile && !cvText.trim())}
          className={`w-full py-5 rounded-2xl flex items-center justify-center space-x-3 text-lg font-bold transition-all shadow-lg active:scale-95
            ${(isProcessing || (!cvFile && !cvText.trim()))
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#3370ff] hover:bg-[#2858cc] text-white shadow-blue-200'
            }`}
        >
          {isProcessing ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI Đang đọc hồ sơ...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" /> <span>Bắt đầu trích xuất CV</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;

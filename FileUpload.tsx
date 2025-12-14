import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-blue-500" />
          <p className="mb-2 text-sm text-gray-700 font-semibold">
            點擊或拖曳 Excel 文件至此
          </p>
          <p className="text-xs text-gray-500">
            支援格式: .xlsx, .xls (需包含 Material, Length, Width, Height)
          </p>
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={handleChange}
        />
      </label>
    </div>
  );
};
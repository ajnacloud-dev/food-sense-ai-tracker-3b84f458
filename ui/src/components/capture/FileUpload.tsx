
import { useState, useRef } from "react";
import { Upload, Image, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUpload = ({ file, onFileChange }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    // Validate file type (images and PDFs)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP, GIF) or PDF document");
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      onFileChange(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("File removed");
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const isPDF = file?.type === 'application/pdf';
  const isImage = file?.type.startsWith('image/');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload File</label>

      {file ? (
        <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPDF ? (
                <FileText className="h-8 w-8 text-green-600" />
              ) : isImage ? (
                <Image className="h-8 w-8 text-green-600" />
              ) : (
                <FileText className="h-8 w-8 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">
                  {(file.size / 1024 / 1024).toFixed(1)} MB • {isPDF ? 'PDF Document' : isImage ? 'Image' : 'File'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded transition-colors"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          </div>

          {/* Image preview */}
          {isImage && (
            <div className="mt-3">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-48 rounded-lg object-contain mx-auto"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg transition-all cursor-pointer
            ${isDragging
              ? 'border-green-500 bg-green-50 scale-[1.02]'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            aria-label="File upload"
          />

          <div className="p-8 text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Upload className={`h-10 w-10 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
            </div>

            <p className={`text-sm mb-1 ${isDragging ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
              {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>

            <p className="text-xs text-gray-500">
              Images (JPEG, PNG, WebP, GIF) or PDF documents up to 10MB
            </p>

            {/* Mobile-friendly upload button */}
            <button
              type="button"
              className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Choose File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

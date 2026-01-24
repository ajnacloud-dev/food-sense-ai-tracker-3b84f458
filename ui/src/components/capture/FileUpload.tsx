
import { Upload, Image, FileText } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUpload = ({ file, onFileChange }: FileUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
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
        return;
      }
      
      onFileChange(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    toast.success("File removed");
  };

  const isPDF = file?.type === 'application/pdf';
  const isImage = file?.type.startsWith('image/');

  return (
    <div className="space-y-2">
      <label htmlFor="file" className="text-sm font-medium">Upload File</label>
      
      {file ? (
        <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPDF ? (
                <FileText className="h-8 w-8 text-green-600" />
              ) : (
                <Image className="h-8 w-8 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">
                  {(file.size / 1024 / 1024).toFixed(1)} MB • {isPDF ? 'PDF Document' : 'Image'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <input
            id="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file" className="cursor-pointer block p-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Upload className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Tap to upload a file
            </p>
            <p className="text-xs text-gray-500">
              Images (JPEG, PNG, WebP, GIF) or PDF documents up to 10MB
            </p>
          </label>
        </div>
      )}
    </div>
  );
};


import { Upload } from "lucide-react";
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
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }
      
      onFileChange(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="image" className="text-sm font-medium">Upload Image (Optional)</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="image" className="cursor-pointer">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            {file ? (
              <span className="text-green-600 font-medium">{file.name}</span>
            ) : (
              "Click to upload or drag and drop"
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, GIF up to 10MB</p>
        </label>
      </div>
    </div>
  );
};


import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageModalProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageModal = ({ src, alt, className }: ImageModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 border-0">
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

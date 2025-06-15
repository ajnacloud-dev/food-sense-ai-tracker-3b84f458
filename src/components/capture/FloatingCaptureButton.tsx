
import { Camera } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuickCaptureModal } from "./QuickCaptureModal";
import { useIsMobile } from "@/hooks/use-mobile";

export const FloatingCaptureButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={`
          fixed shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50
          ${isMobile 
            ? 'bottom-4 right-4 h-12 w-12 rounded-full' 
            : 'bottom-6 right-6 h-14 w-14 rounded-full'
          }
        `}
        size="icon"
      >
        <Camera className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
        <span className="sr-only">Quick Capture</span>
      </Button>

      <QuickCaptureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

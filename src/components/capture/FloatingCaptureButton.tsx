
import { Camera } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuickCaptureModal } from "./QuickCaptureModal";

export const FloatingCaptureButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50"
        size="icon"
      >
        <Camera className="h-6 w-6" />
        <span className="sr-only">Quick Capture</span>
      </Button>

      <QuickCaptureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

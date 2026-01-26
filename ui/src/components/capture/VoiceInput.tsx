
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { toast } from "sonner";
import { backendApi } from "@/lib/api/client";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const VoiceInput = ({ onTranscription, disabled = false, placeholder = "Click to record" }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.error('Failed to process audio recording');
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Processing recording...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call our Supabase Edge Function for speech-to-text
        const { data, error } = await backendApi.functions.invoke('speech-to-text', {
          body: { audio: base64Audio },
        });

        if (error) {
          throw new Error(error.message || 'Failed to transcribe audio');
        }

        if (data?.text) {
          onTranscription(data.text);
          toast.success('Audio transcribed successfully!');
        } else {
          toast.error('No speech detected in the recording');
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe audio');
    }
  };

  const handleClick = () => {
    if (disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className="flex items-center gap-2"
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
          Processing...
        </>
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Record Voice
        </>
      )}
    </Button>
  );
};

export default VoiceInput;

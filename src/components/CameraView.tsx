import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      <div className="relative w-full h-full max-w-2xl mx-auto overflow-hidden bg-zinc-900">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black rounded-full font-medium"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Depth of Field Blur Overlay */}
            <div 
              className="absolute inset-0 backdrop-blur-[3px] pointer-events-none z-10"
              style={{ 
                maskImage: 'radial-gradient(circle at center, transparent 140px, black 240px)',
                WebkitMaskImage: 'radial-gradient(circle at center, transparent 140px, black 240px)'
              }}
            />

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <button
                onClick={onClose}
                className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"
              >
                <X size={24} />
              </button>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/30 active:scale-90 transition-transform"
              >
                <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10" />
              </button>
            </div>

            {/* AR-style Guide Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

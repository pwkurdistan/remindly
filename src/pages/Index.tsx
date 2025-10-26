import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import camera from "../assets/camera.png";

const Index = () => {
  const navigate = useNavigate();
  const [dragPosition, setDragPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const button = (e.target as HTMLElement).closest('.drag-button');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = Math.max(0, Math.min(clientX - rect.left - 28, rect.width - 56));
    setDragPosition(position);

    if (position >= rect.width - 70) {
      navigate("/auth");
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragPosition(0);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center relative overflow-hidden">
      {/* Decorative waves */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-20 z-0">
        <svg width="100%" height="50" viewBox="0 0 1440 50">
          <path d="M0,25 Q360,0 720,25 T1440,25" fill="none" stroke="white" strokeWidth="3" />
        </svg>
        <svg width="100%" height="50" viewBox="0 0 1440 50">
          <path d="M0,25 Q360,50 720,25 T1440,25" fill="none" stroke="white" strokeWidth="3" />
        </svg>
        <svg width="100%" height="50" viewBox="0 0 1440 50">
          <path d="M0,25 Q360,0 720,25 T1440,25" fill="none" stroke="white" strokeWidth="3" />
        </svg>
      </div>

      {/* Centered Content Block */}
      <div className="relative z-10 flex flex-col items-center space-y-8 px-6">
        {/* Camera Image placeholder */}
        <div className="flex items-center justify-center">
          <img src={camera} alt="Camera" className="w-84 h-84 object-contain" />
        </div>

        {/* Text Content */}
        <div className="max-w-md mx-auto text-center">
          <div className="space-y-3 animate-fade-in">
            <h1 className="text-5xl font-fredoka font-bold text-white tracking-tight hidden">Remindly AI</h1>
            <p className="text-white/90 text-lg leading-relaxed px-6 font-medium">
              Capture, organize, and recall your memories instantly with AI. Upload photos, documents, and notes.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="w-full max-w-md mx-auto animate-fade-in">
          <div
            className="drag-button relative w-full h-16 rounded-full bg-primary-light shadow-lg overflow-hidden cursor-pointer"
            onMouseDown={handleDragStart}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDrag}
            onTouchEnd={handleDragEnd}
          >
            <div className="relative w-full h-full flex items-center">
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl z-10">
                  Continue
              </span>
              <div
                  className="absolute top-1 left-1 h-14 rounded-full bg-card z-20 flex items-center justify-end"
                  style={{ width: `${dragPosition + 56}px` }}
              >
                  <div className="w-14 h-14 flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-white" />
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

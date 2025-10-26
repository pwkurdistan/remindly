import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import rewindLogo from "@/assets/rewind-logo.png";
import heroBrain from "@/assets/hero-brain.png";
import { useState } from "react";

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
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden">
      {/* Decorative waves */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <svg width="100%" height="200" viewBox="0 0 1440 200" className="absolute top-1/3">
          <path d="M0,100 Q360,50 720,100 T1440,100" fill="none" stroke="white" strokeWidth="2" />
          <path d="M0,120 Q360,70 720,120 T1440,120" fill="none" stroke="white" strokeWidth="2" />
          <path d="M0,140 Q360,90 720,140 T1440,140" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 space-y-6 max-w-md mx-auto text-center">
        {/* Icon/Image */}
        <div className="mb-4 animate-fade-in">
          <img 
            src={rewindLogo} 
            alt="Rewind Logo" 
            className="w-20 h-20 mx-auto animate-pulse"
          />
        </div>

        {/* Camera Image */}
        <div className="animate-fade-in">
          <img 
            src={heroBrain} 
            alt="Memory capture" 
            className="w-64 h-64 mx-auto"
          />
        </div>

        {/* Hero Text */}
        <div className="space-y-3 animate-fade-in">
          <h1 className="text-5xl font-fredoka font-bold text-white tracking-tight">
            Remindly
          </h1>
          <p className="text-white/90 text-sm leading-relaxed px-6 font-medium">
            Store, organize, and recall your memories instantly with AI. Upload photos, documents, and notes.
          </p>
        </div>
      </div>

      {/* CTA Button - Draggable iPhone Switch Style */}
      <div className="z-10 w-full max-w-md mx-auto animate-fade-in px-6 pb-8">
        <div 
          className="drag-button relative w-full h-14 rounded-full bg-white/20 backdrop-blur-sm shadow-glow overflow-hidden cursor-pointer"
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
        >
          <div className="absolute inset-0 rounded-full bg-white/10"></div>
          <div 
            className="absolute left-1 top-1 bottom-1 w-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform duration-100"
            style={{ transform: `translateX(${dragPosition}px)` }}
          >
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-white text-base font-semibold">
            Continue
          </span>
        </div>
      </div>
    </div>
  );
};

export default Index;

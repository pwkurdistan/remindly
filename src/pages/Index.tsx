import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import rewindLogo from "@/assets/rewind-logo.png";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden">
      {/* Decorative waves */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <svg width="100%" height="200" viewBox="0 0 1440 200" className="absolute top-1/3">
          <path d="M0,100 Q360,50 720,100 T1440,100" fill="none" stroke="white" strokeWidth="2" />
          <path d="M0,120 Q360,70 720,120 T1440,120" fill="none" stroke="white" strokeWidth="2" />
          <path d="M0,140 Q360,90 720,140 T1440,140" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 space-y-8 max-w-md mx-auto text-center">
        {/* Icon/Image */}
        <div className="mb-8 animate-fade-in">
          
        </div>

        {/* Hero Text */}
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-6xl font-fredoka font-bold text-white tracking-tight">
            Remindly
          </h1>
          <p className="text-white/80 text-base leading-relaxed px-4">
            Store, organize, and recall your memories instantly with AI. Upload photos, documents, and notes.
          </p>
        </div>
      </div>

      {/* CTA Button - iPhone Switch Style */}
      <div className="z-10 w-full max-w-md mx-auto animate-fade-in px-6">
        <button 
          onClick={() => navigate("/auth")} 
          className="relative w-full h-16 rounded-full bg-secondary/40 backdrop-blur-sm shadow-glow transition-all duration-300 hover:scale-105 group overflow-hidden"
        >
          <div className="absolute inset-0 rounded-full bg-secondary/60"></div>
          <div className="absolute left-2 top-2 bottom-2 w-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
          <span className="relative text-white text-lg font-semibold pl-16">
            Continue
          </span>
        </button>
      </div>
    </div>;
};
export default Index;
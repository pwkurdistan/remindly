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
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Remindly
          </h1>
          <p className="text-white/90 text-lg leading-relaxed px-4">
            Store, organize, and recall your memories instantly with AI. Upload photos, documents, and notes.
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="z-10 w-full max-w-md mx-auto animate-fade-in">
        <Button onClick={() => navigate("/auth")} size="lg" className="w-full h-16 text-lg rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 backdrop-blur-sm shadow-glow transition-all duration-300 hover:scale-105">
          <span className="flex items-center justify-center gap-3">
            Continue
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>
      </div>
    </div>;
};
export default Index;
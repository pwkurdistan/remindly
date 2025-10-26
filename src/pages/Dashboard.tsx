import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Grid3x3, Search, Bell, Image as ImageIcon, Video, Play, Folder, Plus, Home, Camera, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroBrain from "@/assets/hero-brain.png";
import memoryIcon from "@/assets/memory-icon.png";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Navigation */}
      <nav className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl w-12 h-12 bg-card hover:bg-card/80"
          >
            <Grid3x3 className="w-5 h-5 text-foreground" />
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-11 h-11 bg-card hover:bg-card/80"
            >
              <Search className="w-5 h-5 text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-11 h-11 bg-card hover:bg-card/80"
            >
              <Bell className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="px-6 space-y-6">
        {/* Welcome Section */}
        <section className="animate-fade-in">
          <h2 className="text-3xl font-normal text-foreground">
            Welcome <span className="font-bold">{user?.email?.split('@')[0] || 'back'}</span>,
          </h2>
        </section>

        {/* Latest Memories Card */}
        <section className="animate-fade-in">
          <div className="relative bg-primary rounded-[32px] p-8 overflow-hidden shadow-medium">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4">
                Your Latest<br />Memories
              </h3>
              <div className="flex items-center space-x-4 text-white/90 text-sm mb-6">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>132 Images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>16 Videos</span>
                </div>
              </div>
              <Button
                size="icon"
                className="rounded-full w-14 h-14 bg-[#FF69B4] hover:bg-[#FF69B4]/90 text-white shadow-lg"
              >
                <Play className="w-6 h-6 fill-white" />
              </Button>
            </div>
            
            {/* Tilted Photo Cards */}
            <div className="absolute right-6 top-8 flex space-x-3">
              <div className="w-28 h-36 bg-[#C4787E] rounded-3xl overflow-hidden transform rotate-12 shadow-lg">
                <img src={heroBrain} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-28 h-36 bg-card rounded-3xl overflow-hidden transform rotate-6 shadow-lg -mt-4">
                <img src={memoryIcon} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Collections</h3>
            <button className="text-muted-foreground text-sm hover:text-primary transition-colors">
              See all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="group relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-[28px] h-40 overflow-hidden shadow-soft hover:shadow-medium transition-all cursor-pointer">
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center space-x-1">
                <ImageIcon className="w-3 h-3 text-gray-700" />
                <span className="text-xs text-gray-700 font-semibold">32</span>
              </div>
              <div className="absolute bottom-3 left-3">
                <h4 className="text-white font-semibold text-sm">Summer Nights</h4>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800 to-black rounded-[28px] h-40 overflow-hidden shadow-soft hover:shadow-medium transition-all cursor-pointer">
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center space-x-1">
                <ImageIcon className="w-3 h-3 text-gray-700" />
                <span className="text-xs text-gray-700 font-semibold">13</span>
              </div>
              <div className="absolute bottom-3 left-3">
                <h4 className="text-white font-semibold text-sm">Bassiani</h4>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-amber-200 to-amber-400 rounded-[28px] h-40 overflow-hidden shadow-soft hover:shadow-medium transition-all cursor-pointer">
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center space-x-1">
                <ImageIcon className="w-3 h-3 text-gray-700" />
                <span className="text-xs text-gray-700 font-semibold">28</span>
              </div>
              <div className="absolute bottom-3 left-3">
                <h4 className="text-gray-800 font-semibold text-sm">Mountain</h4>
              </div>
            </div>
          </div>
        </section>

        {/* Folders Section */}
        <section className="animate-fade-in pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Folders</h3>
            <button className="text-muted-foreground text-sm hover:text-primary transition-colors">
              See all
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-card hover:bg-card/80 rounded-[24px] p-4 cursor-pointer transition-all shadow-soft group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-[18px] flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Birthday Images</h4>
                  <p className="text-sm text-muted-foreground">104 images</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation with Center Add Button */}
      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <div className="relative">
          {/* Center Add Button */}
          <div className="absolute -top-7 left-1/2 transform -translate-x-1/2">
            <div className="bg-background rounded-full p-1.5">
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-glow"
              >
                <Plus className="w-7 h-7 text-white" />
              </Button>
            </div>
          </div>

          <div className="bg-primary rounded-[32px] shadow-medium">
            <div className="grid grid-cols-3 py-5 px-8">
              <button className="flex flex-col items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col items-center justify-center">
                {/* Spacer for center button */}
              </div>
              <button className="flex flex-col items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Grid3x3, Bot, User, Image as ImageIcon, Video, Play, Folder, Plus, Camera, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroBrain from "@/assets/hero-brain.png";
import memoryIcon from "@/assets/memory-icon.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import imageCompression from 'browser-image-compression';

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTalkBubble, setShowTalkBubble] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMemories = async (userId: string) => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching memories:', error);
      } else {
        setMemories(data);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    const sessionSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchMemories(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      } else {
        fetchMemories(session.user.id);
        const justLoggedIn = sessionStorage.getItem('justLoggedIn');
        if (justLoggedIn) {
          setShowTalkBubble(true);
          sessionStorage.removeItem('justLoggedIn');
        }
      }
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      sessionSubscription.data.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  const handleConfirmPasswordReset = async () => {
    if (!user) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a link to reset your password.",
      });
    }
    setShowPasswordConfirm(false);
    setShowProfileMenu(false);
  };
  
  const handleChangePasswordClick = () => {
    setShowPasswordConfirm(true);
  };

  const handleScreenClick = () => {
    if (showTalkBubble) {
      setShowTalkBubble(false);
    }
  };

  const toggleProfileMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const getFileHash = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;
  
    toast({
      title: "Processing memories...",
      description: `Analyzing ${files.length} file(s). Please wait.`,
    });
  
    for (const file of Array.from(files)) {
      try {
        let processedFile = file;
        
        if (file.type.startsWith('image/')) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          };
          processedFile = await imageCompression(file, options);
        }
  
        const hash = await getFileHash(processedFile);
  
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(processedFile);
        });
  
        const { data, error } = await supabase.functions.invoke('upload-memory', {
          body: { 
            fileData,
            fileName: processedFile.name,
            fileType: processedFile.type,
            hash, 
            comment: '', 
            user_id: user.id 
          }
        });
  
        if (error) {
          if (error.context?.status === 409) {
            toast({
              variant: "destructive",
              title: "Duplicate Memory",
              description: `"${file.name}" has already been stored.`,
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Memory saved!",
            description: `${processedFile.name} has been added to your memories.`,
          });
        }
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: `Could not process "${file.name}": ${e.message}`,
        });
      }
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event);
  };

  const handleChatbotClick = () => {
    navigate("/chat");
  };

  const imageCount = memories.filter(m => m.file_type.startsWith('image/')).length;
  const documentCount = memories.filter(m => !m.file_type.startsWith('image/')).length;
  const recentImages = memories.filter(m => m.file_type.startsWith('image/')).slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f2e6eb' }} onClick={handleScreenClick}>
      <nav className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-2xl w-12 h-12 bg-card hover:bg-card/80">
            <Grid3x3 className="w-5 h-5 text-foreground" />
          </Button>
          <div className="relative flex items-center space-x-3" ref={profileMenuRef}>
            <Button variant="ghost" size="icon" className="rounded-full w-11 h-11 bg-card hover:bg-card/80" onClick={toggleProfileMenu}>
              <User className="w-5 h-5 text-foreground" />
            </Button>
            {showProfileMenu && (
              <div className="absolute top-16 right-0 rounded-2xl shadow-lg border w-48 z-20" style={{ backgroundColor: '#f2e6eb', borderColor: 'hsl(340 25% 30%)' }}>
                <div className="p-2">
                  <button
                    onClick={handleChangePasswordClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 rounded-lg hover:bg-card hover:text-primary-foreground"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 rounded-lg hover:bg-card hover:text-primary-foreground"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="px-6 space-y-6">
        {/* Welcome Section */}
        <section className="animate-fade-in">
          <h2 className="text-3xl font-normal text-gray-900">
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
                  <span>{imageCount} Images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4" />
                  <span>{documentCount} Documents</span>
                </div>
              </div>
              <Button size="icon" className="rounded-full w-14 h-14 bg-[#FF69B4] hover:bg-[#FF69B4]/90 text-white shadow-lg">
                <Play className="w-6 h-6 fill-white" />
              </Button>
            </div>
            
            {/* Tilted Photo Cards */}
            <div className="absolute right-6 top-8 flex space-x-3">
              <div className="w-28 h-36 bg-[#C4787E] rounded-3xl overflow-hidden transform rotate-12 shadow-lg">
                <img src={recentImages[0] ? `${supabase.storage.from('memories').getPublicUrl(recentImages[0].file_path).data.publicUrl}` : heroBrain} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-28 h-36 bg-card rounded-3xl overflow-hidden transform rotate-6 shadow-lg -mt-4">
                <img src={recentImages[1] ? `${supabase.storage.from('memories').getPublicUrl(recentImages[1].file_path).data.publicUrl}` : memoryIcon} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Collections</h3>
            <button className="text-gray-900 text-sm hover:text-primary transition-colors">
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
            <h3 className="text-xl font-bold text-gray-900">Folders</h3>
            <button className="text-gray-900 text-sm hover:text-primary transition-colors">
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

      <AlertDialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <AlertDialogContent style={{ backgroundColor: '#f2e6eb', borderColor: 'hsl(340 25% 30%)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">Confirm Password Reset</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to send a password reset link to your email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowProfileMenu(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPasswordReset}>Yes, Send Link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <div className="relative">
          {/* AI Chatbot bubble */}
          {showTalkBubble && (
            <div
              className="absolute bottom-full left-8 mb-3 w-48 p-3 rounded-xl shadow-lg border"
              style={{ backgroundColor: '#f2e6eb', borderColor: 'hsl(340 25% 30%)' }}
            >
              <p className="text-sm text-gray-800">Upload your first memory and whenever you forget it I will help you remember.</p>
              <div
                className="absolute left-1/2 transform -translate-x-1/2 bottom-[-8px] w-0 h-0 border-t-8 border-l-8 border-l-transparent border-r-8 border-r-transparent"
                style={{ borderTopColor: 'hsl(340 25% 30%)' }}
              ></div>
              <div
                className="absolute left-1/2 transform -translate-x-1/2 bottom-[-7px] w-0 h-0 border-t-8 border-l-8 border-l-transparent border-r-8 border-r-transparent"
                style={{ borderTopColor: '#f2e6eb' }}
              ></div>
            </div>
          )}

          {/* Center Add Button */}
          <div className="absolute -top-7 left-1/2 transform -translate-x-1/2">
            <div className="rounded-full p-1.5" style={{ backgroundColor: '#f2e6eb' }}>
              <Button 
                size="icon" 
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-glow"
                onClick={handleFileUpload}
              >
                <Plus className="w-7 h-7 text-white" />
              </Button>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
          />

          <div className="bg-primary rounded-[32px] shadow-medium">
            <div className="grid grid-cols-3 py-5 px-8">
              <button 
                className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                onClick={handleChatbotClick}
              >
                <Bot className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col items-center justify-center">
                {/* Spacer for center button */}
              </div>
              <button 
                className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                onClick={handleCameraClick}
              >
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

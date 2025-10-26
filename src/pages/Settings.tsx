import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedModel, setSelectedModel] = useState("gemma-3-27b-it");
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedModel(data.selected_llm);
              setApiKey(data.encrypted_api_key || "");
            }
          });
      }
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      selected_llm: selectedModel,
      encrypted_api_key: apiKey,
    }, { onConflict: 'user_id' });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } else {
      toast({
        title: "Settings Saved",
        description: "Your new settings have been saved successfully.",
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f2e6eb' }}>
      <nav className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-2xl w-12 h-12 bg-card hover:bg-card/80" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
      </nav>
      <main className="px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label htmlFor="llm-select" className="block text-sm font-medium text-gray-700 mb-2">
              Language Model
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="llm-select">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemma-3-27b-it">gemma-3-27b-it (Default)</SelectItem>
                <SelectItem value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</SelectItem>
                <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                <SelectItem value="gemini-flash-lite-latest">gemini-flash-lite-latest</SelectItem>
                <SelectItem value="gemini-flash-latest">gemini-flash-latest</SelectItem>
                <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedModel !== "gemma-3-27b-it" && (
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Chat Memory Function Started ===");
    
    // API Key Checks
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    console.log("API Keys check:", {
      hasGoogleKey: !!GOOGLE_API_KEY,
      hasLovableKey: !!LOVABLE_API_KEY
    });
    
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured.");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured.");

    const { messages, user_id } = await req.json();
    console.log("Request data:", { 
      messageCount: messages?.length, 
      userId: user_id,
      latestMessage: messages?.[messages.length - 1]?.content?.substring(0, 50)
    });
    
    const latestMessage = messages[messages.length - 1].content;

    // 1. Get user settings for LLM and API key (now resilient)
    console.log("Fetching user settings...");
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user_id);

    if (settingsError) {
      console.error("Settings error:", settingsError);
      throw settingsError;
    }
    console.log("User settings retrieved:", { 
      hasSettings: !!userSettings?.[0],
      selectedModel: userSettings?.[0]?.selected_llm 
    });

    const selectedModel = userSettings?.[0]?.selected_llm || "gemma-3-27b-it";
    const apiKey = userSettings?.[0]?.encrypted_api_key || LOVABLE_API_KEY;

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
    });

    // 2. Generate an embedding for the user's question using Google's Gemini API
    console.log("Generating embedding with Gemini...");
    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "models/text-embedding-004" });
      const embeddingResponse = await model.embedContent(latestMessage);
      const query_embedding = embeddingResponse.embedding.values;
      console.log("Embedding generated:", { 
        dimension: query_embedding?.length,
        firstFewValues: query_embedding?.slice(0, 3) 
      });

      // 3. Find relevant memories
      console.log("Calling match_memories RPC...");
      const { data: relevantMemories, error: memoryError } = await supabase.rpc("match_memories", {
        query_embedding,
        match_threshold: 0.5,
        match_count: 5,
        request_user_id: user_id,
      });

      if (memoryError) {
        console.error("Memory RPC error:", memoryError);
        throw new Error(`Memory search failed: ${memoryError.message}`);
      }
      console.log("Memories retrieved:", { count: relevantMemories?.length || 0 });

      // 4. Construct a rich prompt
      const context =
        relevantMemories
          ?.map(
            (mem: any) => `
        - Memory: "${mem.extracted_text}" (Comment: ${mem.user_comment || "none"})
        - Source File: ${mem.file_path}
      `,
          )
          .join("\n") || "";

      const systemPrompt = `You are Remindly AI, a friendly and intelligent memory assistant.
      - Your user is having a conversation with you about their memories.
      - Below is a list of memories that might be relevant to their latest message.
      - Use this information to answer their question thoughtfully and accurately.
      - If you reference a memory that has a "Source File," you MUST provide a clickable link to it.
      - Format the link like this: [link to source](storage_url)
      - The base URL for storage is: ${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/memories/
      - ALWAYS be helpful and friendly.

      Relevant Memories:
      ${context || "No relevant memories found."}
      `;

      // 5. Call the selected LLM via the Lovable AI Gateway
      console.log("Calling Lovable AI Gateway...");
      const response = await openai.chat.completions.create({
        model: selectedModel,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      });
      console.log("AI response received");

      const aiResponse = response.choices[0].message.content || "I'm here to help with your memories!";

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (embeddingError) {
      console.error("Embedding generation error:", embeddingError);
      if (embeddingError instanceof Error) {
        console.error("Error details:", {
          name: embeddingError.name,
          message: embeddingError.message,
          stack: embeddingError.stack
        });
      }
      throw embeddingError;
    }
  } catch (error) {
    console.error("=== Chat Memory Function Error ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error details:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

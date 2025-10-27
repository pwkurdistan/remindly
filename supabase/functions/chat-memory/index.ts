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
    const { messages, user_id } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    // 1. Get user settings for LLM and API key
    const { data: userSettings } = await supabase.from("user_settings").select("*").eq("user_id", user_id).single();

    const selectedModel = userSettings?.selected_llm || "gemma-3-27b-it";
    const apiKey = userSettings?.encrypted_api_key || Deno.env.get("LOVABLE_API_KEY");
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
    });

    // 2. Generate an embedding for the user's question using Google's Gemini API
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not configured");
    }
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embeddingResponse = await model.embedContent(latestMessage);
    const query_embedding = embeddingResponse.embedding.values;

    // 3. Find relevant memories
    const { data: relevantMemories } = await supabase.rpc("match_memories", {
      query_embedding,
      match_threshold: 0.5,
      match_count: 5,
      request_user_id: user_id,
    });

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
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const aiResponse = response.choices[0].message.content || "I'm here to help with your memories!";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured.");

    const { messages, user_id } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const chatModel = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

    // 1. Generate an embedding for the user's question
    const embeddingResponse = await embeddingModel.embedContent(latestMessage, { outputDimensionality: 768 });
    const query_embedding = embeddingResponse.embedding.values;

    // 2. Find relevant memories
    const { data: relevantMemories } = await supabase.rpc("match_memories", {
      query_embedding,
      match_threshold: 0.5,
      match_count: 5,
      request_user_id: user_id,
    });

    // 3. Construct a rich prompt
    const context = relevantMemories?.map((mem: any) => `...`).join("\n") || "";
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

    // 4. Call the Gemini chat model
    const chat = await chatModel.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will follow these instructions." }] },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(latestMessage);
    const aiResponse = result.response.text() || "I'm here to help with your memories!";

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

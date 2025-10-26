import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

    // 1. Generate an embedding for the user's question using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // For embeddings, we still need OpenAI since Lovable AI doesn't support embeddings
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for embeddings");
    }

    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: latestMessage,
      }),
    });
    
    const embeddingData = await embeddingResponse.json();
    const query_embedding = embeddingData.data[0].embedding;

    // 3. Find relevant memories
    const { data: relevantMemories } = await supabase.rpc("match_memories", {
      query_embedding,
      match_threshold: 0.5,
      match_count: 5,
      request_user_id: user_id,
    });

    // 4. Construct a rich prompt
    const context = relevantMemories.map(mem => `
      - Memory: "${mem.extracted_text}" (Comment: ${mem.user_comment || 'none'})
      - Source File: ${mem.file_path}
    `).join('\n');

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

    // 5. Call Lovable AI with Gemini
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      throw new Error(errorData.error || "Failed to get AI response");
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content || "I'm here to help with your memories!";

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

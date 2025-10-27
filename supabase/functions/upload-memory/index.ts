import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai";

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
    const { fileData, fileName, fileType, hash, comment, user_id } = await req.json();

    // 1. Check for duplicates
    const { data: existingMemory, error: hashError } = await supabase
      .from("memories")
      .select("id")
      .eq("user_id", user_id)
      .eq("content_hash", hash);

    if (hashError) throw hashError;
    if (existingMemory && existingMemory.length > 0) {
      return new Response(JSON.stringify({ message: "This memory already exists." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Convert base64 to file buffer
    const base64Data = fileData.split(",")[1];
    const fileBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // 3. Upload file to storage
    const filePath = `${user_id}/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage.from("memories").upload(filePath, fileBuffer, {
      contentType: fileType,
      upsert: false,
    });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // 4. Extract text from the file (OCR) - Using a placeholder for now
    const extracted_text = `File uploaded: ${fileName}`;

    // 5. Generate a vector embedding using OpenAI directly (Lovable AI Gateway doesn't support embeddings)
    // We'll use a direct OpenAI API call instead
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured - cannot generate embeddings");
      return new Response(JSON.stringify({ error: "OpenAI API key not configured. Please add your OpenAI API key to enable memory search functionality." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let embedding;
    try {
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: `${comment}\n${extracted_text}`,
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error("OpenAI embedding error:", errorText);
        throw new Error(`OpenAI API error: ${embeddingResponse.status} - ${errorText}`);
      }

      const embeddingData = await embeddingResponse.json();
      embedding = embeddingData.data[0].embedding;
    } catch (embeddingError) {
      console.error("Embedding generation failed:", embeddingError);
      throw new Error(`Failed to generate embedding: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
    }

    // 6. Save the memory to the database
    const { error: insertError } = await supabase.from("memories").insert({
      user_id,
      content_hash: hash,
      extracted_text,
      user_comment: comment,
      file_path: filePath,
      file_type: fileType,
      embedding,
    });
    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ message: "Memory uploaded successfully." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in upload-memory:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

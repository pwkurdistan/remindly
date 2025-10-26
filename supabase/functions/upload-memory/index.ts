import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai";

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
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Convert base64 to file buffer
    const base64Data = fileData.split(',')[1];
    const fileBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // 3. Upload file to storage
    const filePath = `${user_id}/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("memories")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false
      });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // 4. Extract text from the file (OCR) - Using a placeholder for now
    const extracted_text = `Image uploaded: ${fileName}`;

    // 5. Generate a vector embedding
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${comment}\n${extracted_text}`,
    });
    const embedding = embeddingResponse.data[0].embedding;

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
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in upload-memory:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

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
    const { fileData, fileName, fileType, hash, comment, user_id } = await req.json();

    // 1. Check for duplicates
    // ... (same as before)

    // 2. Convert base64 to file buffer
    const base64Data = fileData.split(",")[1];
    const fileBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // 3. Upload file to storage
    // ... (same as before)

    // 4. Extract text from the file (OCR) - Placeholder
    const extracted_text = `File uploaded: ${fileName}`;

    // 5. Generate a vector embedding using Google's Gemini API
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const embeddingResponse = await model.embedContent(`${comment}\n${extracted_text}`);
    const embedding = embeddingResponse.embedding.values;

    // 6. Save the memory to the database
    // ... (same as before)

    return new Response(JSON.stringify({ message: "Memory uploaded successfully." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in upload-memory:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

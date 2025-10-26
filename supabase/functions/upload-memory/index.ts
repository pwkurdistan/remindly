import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

serve(async (req) => {
  const { file, hash, comment, user_id } = await req.json();

  // 1. Check for duplicates
  const { data: existingMemory, error: hashError } = await supabase
    .from("memories")
    .select("id")
    .eq("user_id", user_id)
    .eq("content_hash", hash);

  if (hashError) throw hashError;
  if (existingMemory.length > 0) {
    return new Response(JSON.stringify({ message: "This memory already exists." }), { status: 409 });
  }

  // 2. Upload file to storage
  const filePath = `${user_id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("memories")
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  // 3. Extract text from the file (OCR) - Using a placeholder for the actual AI model
  const extracted_text = "This is a placeholder for the extracted text from the file.";

  // 4. Generate a vector embedding
  const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: `${comment}\n${extracted_text}`,
  });
  const embedding = embeddingResponse.data[0].embedding;

  // 5. Save the memory to the database
  const { error: insertError } = await supabase.from("memories").insert({
    user_id,
    content_hash: hash,
    extracted_text,
    user_comment: comment,
    file_path: filePath,
    file_type: file.type,
    embedding,
  });
  if (insertError) throw insertError;

  return new Response(JSON.stringify({ message: "Memory uploaded successfully." }), { status: 200 });
});

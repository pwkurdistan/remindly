-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  selected_llm TEXT NOT NULL DEFAULT 'gemma-3-27b-it',
  encrypted_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add embedding column to existing memories table
ALTER TABLE public.memories 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS user_comment TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add unique constraint for content_hash per user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memories_user_id_content_hash_key'
  ) THEN
    ALTER TABLE public.memories ADD CONSTRAINT memories_user_id_content_hash_key UNIQUE (user_id, content_hash);
  END IF;
END $$;

-- Create function to search for memories using embeddings
CREATE OR REPLACE FUNCTION public.match_memories (
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  request_user_id UUID
) RETURNS TABLE (
  id UUID,
  extracted_text TEXT,
  user_comment TEXT,
  file_path TEXT,
  similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.extracted_text,
    memories.user_comment,
    memories.file_path,
    1 - (memories.embedding <=> query_embedding) AS similarity
  FROM public.memories
  WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
    AND memories.user_id = request_user_id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
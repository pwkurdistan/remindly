-- Drop the old function
DROP FUNCTION match_memories;

-- Recreate the function with the correct 768-dimensional vector type
CREATE FUNCTION match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  request_user_id uuid
) RETURNS TABLE (
  id bigint,
  extracted_text text,
  user_comment text,
  file_path text,
  similarity float
) LANGUAGE plpgsql AS $$
#variable_conflict use_variable
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.extracted_text,
    memories.user_comment,
    memories.file_path,
    1 - (memories.embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
    AND memories.user_id = request_user_id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

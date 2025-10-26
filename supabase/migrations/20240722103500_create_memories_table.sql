-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your memories
create table
  memories (
    id bigserial primary key,
    user_id uuid references auth.users not null,
    content_hash text not null,
    extracted_text text,
    user_comment text,
    file_path text,
    file_type text,
    embedding vector(384), -- Corresponds to the embedding model's dimensions
    created_at timestamptz default now(),
    unique (user_id, content_hash)
  );

-- Create a function to search for memories
create function match_memories (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  request_user_id uuid
) returns table (
  id bigint,
  extracted_text text,
  user_comment text,
  file_path text,
  similarity float
) language plpgsql as $$
#variable_conflict use_variable
begin
  return query
  select
    memories.id,
    memories.extracted_text,
    memories.user_comment,
    memories.file_path,
    1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  where 1 - (memories.embedding <=> query_embedding) > match_threshold
    and memories.user_id = request_user_id
  order by similarity desc
  limit match_count;
end;
$$;

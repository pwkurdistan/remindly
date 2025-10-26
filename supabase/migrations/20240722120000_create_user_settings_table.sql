create table
  user_settings (
    id bigserial primary key,
    user_id uuid references auth.users not null unique,
    selected_llm text not null default 'gemma-3-27b-it',
    encrypted_api_key text,
    created_at timestamptz default now()
  );

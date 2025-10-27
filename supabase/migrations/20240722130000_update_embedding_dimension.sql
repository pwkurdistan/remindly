-- Alter the embedding column to support Gemini's 768-dimensional vectors
ALTER TABLE memories
ALTER COLUMN embedding TYPE vector(768);

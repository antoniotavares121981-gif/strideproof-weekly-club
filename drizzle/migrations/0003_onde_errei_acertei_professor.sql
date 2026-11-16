ALTER TABLE public.treinos_feitos ADD COLUMN IF NOT EXISTS onde_errei text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS onde_acertei text NOT NULL DEFAULT '';
CREATE TABLE public.professor (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), nome text NOT NULL DEFAULT '', whatsapp text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.professor TO service_role;
ALTER TABLE public.professor ENABLE ROW LEVEL SECURITY;
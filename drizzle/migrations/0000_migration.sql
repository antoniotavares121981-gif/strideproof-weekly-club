CREATE TABLE public.alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  whatsapp text NOT NULL,
  objetivo text NOT NULL DEFAULT '',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  rascunho jsonb NOT NULL DEFAULT '[]'::jsonb,
  plano_enviado jsonb,
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.alunos TO service_role;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.treinos_feitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  dia_index int NOT NULL,
  dia text NOT NULL,
  km text NOT NULL,
  tempo text NOT NULL,
  pace text NOT NULL DEFAULT '',
  foto text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.treinos_feitos TO service_role;
ALTER TABLE public.treinos_feitos ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.treinos_feitos (aluno_id, created_at DESC);
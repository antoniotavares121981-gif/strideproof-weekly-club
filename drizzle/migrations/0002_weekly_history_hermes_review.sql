CREATE TABLE public.semanas_aluno (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
 semana date NOT NULL,
 tema text NOT NULL DEFAULT '',
 rascunho jsonb NOT NULL DEFAULT '[]'::jsonb,
 plano_enviado jsonb,
 enviado_em timestamptz,
 UNIQUE(aluno_id, semana)
);
GRANT ALL ON public.semanas_aluno TO service_role;
ALTER TABLE public.semanas_aluno ENABLE ROW LEVEL SECURITY;
INSERT INTO public.semanas_aluno(aluno_id,semana,rascunho,plano_enviado,enviado_em)
SELECT id,date_trunc('week',coalesce(enviado_em,created_at) AT TIME ZONE 'America/Bahia')::date,rascunho,plano_enviado,enviado_em FROM public.alunos;
ALTER TABLE public.treinos_feitos ADD COLUMN semana date;
UPDATE public.treinos_feitos SET semana=date_trunc('week',created_at AT TIME ZONE 'America/Bahia')::date WHERE semana IS NULL;
ALTER TABLE public.treinos_feitos ALTER COLUMN semana SET NOT NULL;
ALTER TABLE public.treinos_feitos ADD COLUMN revisado_em timestamptz;
ALTER TABLE public.treinos_feitos ADD COLUMN liberar_em timestamptz;
ALTER TABLE public.treinos_feitos ADD COLUMN envio_cancelado boolean NOT NULL DEFAULT false;
UPDATE public.treinos_feitos SET revisado_em=created_at,liberar_em=created_at WHERE avaliacao IS NOT NULL;
CREATE INDEX treinos_por_semana ON public.treinos_feitos(aluno_id,semana,created_at);
COMMENT ON COLUMN public.alunos.rascunho IS 'DEPRECATED: weekly drafts now stored in semanas_aluno; preserved for legacy data.';
COMMENT ON COLUMN public.alunos.plano_enviado IS 'DEPRECATED: weekly sent plans now stored in semanas_aluno; preserved for legacy data.';
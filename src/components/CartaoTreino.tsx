import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { AvaliacaoHermes } from "@/components/Hermes";
import { useRegistro } from "@/lib/armazenamento";
import { resumoMeta, type Dia } from "@/lib/plano";

export function CartaoTreino({ alunoId, semana, dia, data }: { alunoId: string; semana: string; dia: Dia; data: string }) {
  const [registro] = useRegistro(alunoId, semana, dia.id);
  return (
    <li className="space-y-2">
      <div className="rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-2xl leading-none">
              {dia.curto} <span className="text-base text-paper-muted">{data}</span>
            </p>
            <p className="text-lg font-bold">{dia.meta.tipo}</p>
          </div>
          {registro ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
              <CheckCircle2 className="h-4 w-4" /> CONCLUÍDO
            </span>
          ) : null}
        </div>
        <p className="mt-2 font-semibold text-paper-muted">{resumoMeta(dia.meta)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            to="/alunos/$id/$dia"
            params={{ id: alunoId, dia: dia.id }}
            className="rounded-xl border-2 border-paper-foreground/15 py-2 text-center text-xs font-bold"
          >
            VER DETALHES DO TREINO
          </Link>
          <Link
            to="/alunos/$id/$dia"
            params={{ id: alunoId, dia: dia.id }}
            search={{ editar: true }}
            className="rounded-xl bg-primary py-2 text-center text-xs font-bold text-primary-foreground"
          >
            EDITAR REGISTRO
          </Link>
        </div>
      </div>
      {registro ? <AvaliacaoHermes meta={dia.meta} registro={registro} /> : null}
    </li>
  );
}

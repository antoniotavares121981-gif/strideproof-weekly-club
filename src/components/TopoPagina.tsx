import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function TopoPagina({ voltar, titulo, subtitulo }: { voltar?: ReactNode | true; titulo: ReactNode; subtitulo?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-5 pt-6 pb-4">
      {voltar === true ? (
        <button type="button" onClick={() => history.back()} aria-label="Voltar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        voltar
      )}
      <div className="min-w-0">
        <h1 className="truncate text-4xl text-foreground">{titulo}</h1>
        {subtitulo ? <p className="text-sm text-muted-foreground">{subtitulo}</p> : null}
      </div>
    </header>
  );
}

export function BotaoVoltar({ to }: { to: "/" | "/alunos" }) {
  return (
    <Link to={to} aria-label="Voltar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
      <ArrowLeft className="h-5 w-5" />
    </Link>
  );
}

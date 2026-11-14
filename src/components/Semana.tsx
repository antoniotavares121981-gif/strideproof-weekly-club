import { Archive, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moverSemana, tituloSemana } from "@/lib/semanas";

export function ControleSemana({ semana, atual, mudar, historico }: { semana: string; atual: string; mudar: (s: string) => void; historico: { semana: string; tema: string }[] }) {
  return <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2">
      <Button variant="outline" className="h-auto min-h-12 whitespace-normal text-xs" onClick={() => mudar(moverSemana(semana, -1))}><ChevronLeft className="shrink-0" /> SEMANA ANTERIOR</Button>
      <Button variant={semana === atual ? "hero" : "outline"} className="h-auto min-h-12 whitespace-normal text-xs" onClick={() => mudar(atual)}><CalendarDays className="shrink-0" /> SEMANA ATUAL</Button>
      <Button variant="outline" className="h-auto min-h-12 whitespace-normal text-xs" onClick={() => mudar(moverSemana(semana, 1))}>PRÓXIMA SEMANA <ChevronRight className="shrink-0" /></Button>
    </div>
    <h2 className="font-display text-3xl">{tituloSemana(semana)}</h2>
    <details className="border-y border-border py-3">
      <summary className="flex cursor-pointer items-center gap-2 font-bold"><Archive /> HISTÓRICO</summary>
      <div className="mt-3 space-y-2">{historico.filter((h) => h.semana < atual).map((h) => <Button key={h.semana} variant="outline" className="h-auto min-h-12 w-full whitespace-normal" onClick={() => mudar(h.semana)}>{tituloSemana(h.semana)}{h.tema ? ` — ${h.tema}` : ""}</Button>)}{historico.filter((h) => h.semana < atual).length === 0 ? <p className="text-muted-foreground">Nenhuma semana anterior.</p> : null}</div>
    </details>
  </div>;
}
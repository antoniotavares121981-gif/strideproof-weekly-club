import hermes from "@/assets/hermes.jpg";
import { avaliarHermes, type Registro } from "@/lib/envios";
import type { Meta } from "@/lib/plano";

export function AvaliacaoHermes({ meta, registro }: { meta: Meta; registro: Registro }) {
  const a = avaliarHermes(meta, registro);
  return (
    <section aria-label="Avaliação do Hermes" className="rounded-2xl border-2 border-primary bg-secondary p-4 text-secondary-foreground">
      <div className="flex items-center gap-3">
        <img src={hermes} alt="Hermes, treinador" width={816} height={816} loading="lazy" className="h-16 w-16 rounded-xl object-cover object-top" />
        <div>
          <p className="font-display text-2xl leading-none">AVALIAÇÃO DO HERMES</p>
          <p className={`text-xs font-bold ${a.erros.length ? "text-destructive" : "text-success"}`}>
            {a.erros.length ? "PONTOS A AJUSTAR" : "DENTRO DO PLANO"}
          </p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{a.texto}</p>
    </section>
  );
}

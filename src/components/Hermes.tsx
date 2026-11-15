import hermes from "@/assets/hermes.jpg";
import type { AvaliacaoSalva } from "@/lib/treino";

export function MensagemHermes({ texto }: { texto: string }) {
  return <section aria-label="Mensagem do Hermes" className="border-l-2 border-primary py-3 pl-4 text-foreground">
    <div className="mb-3 flex items-center gap-3"><img src={hermes} alt="Hermes, treinador" className="h-16 w-16 rounded-lg object-cover object-top" /><h2 className="font-display text-2xl">HERMES — ORIENTAÇÕES E COBRANÇA</h2></div>
    <p className="whitespace-pre-line text-sm leading-relaxed">{texto}</p>
  </section>;
}

/** Mesma avaliação para professor e aluno. */
export function AvaliacaoHermes({ avaliacao }: { avaliacao: AvaliacaoSalva }) {
  return (
    <section aria-label="Avaliação do Hermes" className="rounded-2xl border-2 border-primary bg-secondary p-4 text-secondary-foreground">
      <div className="flex items-center gap-3">
        <img src={hermes} alt="Hermes, treinador" width={816} height={816} loading="lazy" className="h-16 w-16 rounded-xl object-cover object-top" />
        <div>
          <p className="font-display text-2xl leading-none">AVALIAÇÃO DO HERMES</p>
          <p className={`text-xs font-bold ${avaliacao.erros.length ? "text-destructive" : "text-success"}`}>
            {avaliacao.erros.length ? "PONTOS A AJUSTAR" : "DENTRO DO PLANO"}
          </p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{avaliacao.texto}</p>
    </section>
  );
}

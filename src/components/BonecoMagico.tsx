import { CheckCircle2, XCircle } from "lucide-react";

import boneco from "@/assets/boneco-magico.png";
import type { Resultado, Tentativa } from "@/lib/envios";

type Estado =
  | { tipo: "esperando" }
  | { tipo: "conferindo"; foto: string }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; antes: Tentativa; depois?: Tentativa | undefined };

export function BonecoMagico({ estado }: { estado: Estado }) {
  const final = estado.tipo === "pronto" ? (estado.depois ?? estado.antes) : null;
  return (
    <section aria-label="Boneco Mágico" className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          <img
            src={boneco}
            alt="Boneco Mágico, o treinador"
            width={1024}
            height={1024}
            loading="lazy"
            className="h-full w-full origin-top scale-[1.9] object-cover"
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-3xl text-card-foreground">BONECO MÁGICO</h2>
          <p className="text-xs font-bold tracking-wider text-primary">AVALIAÇÃO DO TREINO</p>
          {final ? null : <p className="mt-1 text-sm text-muted-foreground">{falaDoBoneco(estado)}</p>}
        </div>
      </div>

      {estado.tipo === "conferindo" ? (
        <div className="relative mt-4 overflow-hidden rounded-2xl">
          <img src={estado.foto} alt="Foto sendo avaliada" className="max-h-72 w-full object-cover opacity-70" />
          <div className="absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <p className="mt-4 rounded-xl bg-destructive/15 p-3 text-sm font-semibold text-destructive">{estado.mensagem}</p>
      ) : null}

      {estado.tipo === "pronto" && final ? (
        <div className="mt-4 space-y-4">
          <p
            className={`rounded-2xl border-l-4 bg-muted p-4 text-base font-semibold leading-snug text-card-foreground ${
              final.resultado.veredito === "CERTO" ? "border-success" : "border-destructive"
            }`}
          >
            {final.resultado.mensagem}
          </p>
          {estado.depois ? (
            <>
              <BlocoResultado titulo="ANTES" resultado={estado.antes.resultado} apagado />
              <BlocoResultado titulo="DEPOIS" resultado={estado.depois.resultado} />
            </>
          ) : (
            <BlocoResultado resultado={estado.antes.resultado} />
          )}
        </div>
      ) : null}
    </section>
  );
}

function falaDoBoneco(estado: Estado) {
  switch (estado.tipo) {
    case "esperando":
      return "Envie a foto do relógio ou do Strava. Eu avalio se o treino seguiu o plano.";
    case "conferindo":
      return "Analisando o treino…";
    case "erro":
      return "Não foi possível avaliar agora.";
    case "pronto":
      return "";
  }
}

function BlocoResultado({
  titulo,
  resultado,
  apagado,
}: {
  titulo?: string;
  resultado: Resultado;
  apagado?: boolean;
}) {
  const certo = resultado.veredito === "CERTO";
  return (
    <div className={apagado ? "opacity-60" : undefined}>
      <div
        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
          certo ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
        }`}
      >
        <span className="font-display text-lg">{titulo ?? "RESULTADO"}</span>
        <span className="font-display text-3xl">{certo ? "CERTO ✅" : "ERRADO ❌"}</span>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {resultado.itens.map((item) => (
          <li key={item.campo} className="flex items-start gap-3 py-2">
            {item.status === "CERTO" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-card-foreground">
                {item.campo}
                {item.valorFoto ? <span className="font-normal text-muted-foreground"> · na foto: {item.valorFoto}</span> : null}
              </p>
              <p className="text-sm text-muted-foreground">{item.motivo}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { Estado as EstadoBoneco };

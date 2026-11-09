import { CheckCircle2, XCircle } from "lucide-react";

import robo from "@/assets/robozinho.png";
import type { Resultado, Tentativa } from "@/lib/envios";

type Estado =
  | { tipo: "esperando" }
  | { tipo: "conferindo"; foto: string }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; antes: Tentativa; depois?: Tentativa };

export function Robozinho({ estado }: { estado: Estado }) {
  return (
    <section aria-label="Robozinho" className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <img src={robo} alt="Robozinho" width={816} height={816} loading="lazy" className="h-20 w-20 animate-robo" />
        <div>
          <h2 className="text-3xl text-card-foreground">ROBOZINHO</h2>
          <p className="text-sm text-muted-foreground">{falaDoRobo(estado)}</p>
        </div>
      </div>

      {estado.tipo === "conferindo" ? (
        <div className="relative mt-4 overflow-hidden rounded-2xl">
          <img src={estado.foto} alt="Foto sendo conferida" className="max-h-72 w-full object-cover opacity-70" />
          <div className="absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <p className="mt-4 rounded-xl bg-destructive/15 p-3 text-sm font-semibold text-destructive">{estado.mensagem}</p>
      ) : null}

      {estado.tipo === "pronto" ? (
        <div className="mt-4 space-y-4">
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

function falaDoRobo(estado: Estado) {
  switch (estado.tipo) {
    case "esperando":
      return "Manda a foto do relógio ou do Strava que eu confiro pra tu!";
    case "conferindo":
      return "Olhando a foto… só um minutinho.";
    case "erro":
      return "Eita, deu ruim aqui.";
    case "pronto": {
      const final = estado.depois ?? estado.antes;
      return final.resultado.mensagem;
    }
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

export type { Estado as EstadoRobo };

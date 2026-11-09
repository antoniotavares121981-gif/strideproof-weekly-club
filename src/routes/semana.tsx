import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { useEnvio } from "@/lib/armazenamento";
import { DIAS, chaveSemana, dataCurta, dataDoDia, segundaDaSemana, type Dia } from "@/lib/plano";

export const Route = createFileRoute("/semana")({
  head: () => ({
    meta: [
      { title: "Treino da semana — Circuito Jaua" },
      { name: "description", content: "Treinos de segunda a domingo do Circuito Jaua." },
      { property: "og:title", content: "Treino da semana — Circuito Jaua" },
      { property: "og:description", content: "Treinos de segunda a domingo do Circuito Jaua." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Semana,
});

function useHoje() {
  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => setHoje(new Date()), []);
  return hoje;
}

function Semana() {
  const hoje = useHoje();
  const seg = hoje ? segundaDaSemana(hoje) : null;
  const dom = seg ? new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 6) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md pb-10">
      <TopoPagina
        voltarPara="/"
        titulo={
          <>
            TREINO DA <span className="text-primary">SEMANA</span>
          </>
        }
        subtitulo={seg && dom ? `${dataCurta(seg)} a ${dataCurta(dom)}` : " "}
      />
      <ul className="space-y-3 px-5">
        {DIAS.map((dia) => (
          <CartaoDia key={dia.id} dia={dia} hoje={hoje} />
        ))}
      </ul>
    </main>
  );
}

function CartaoDia({ dia, hoje }: { dia: Dia; hoje: Date | null }) {
  const semana = chaveSemana(hoje ?? new Date());
  const [envio] = useEnvio(semana, dia.id);
  const data = hoje ? dataDoDia(dia.id, hoje) : null;
  const ehHoje = !!(hoje && data && data.toDateString() === hoje.toDateString());
  const final = envio?.depois ?? envio?.antes;

  return (
    <li
      className={`rounded-2xl border bg-card p-4 shadow-card ${ehHoje ? "border-primary" : "border-border"}`}
    >
      <div className="flex items-start gap-4">
        <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-secondary py-2">
          <span className="font-display text-xl text-primary">{dia.curto}</span>
          <span className="text-xs text-muted-foreground">{data ? dataCurta(data) : "--/--"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl text-card-foreground">{dia.nome}</h2>
            {ehHoje ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">HOJE</span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-card-foreground">{dia.meta.titulo}</p>
          <p className="text-sm text-muted-foreground">
            {dia.meta.km} km · pace {dia.meta.pace} · FC até {dia.meta.fcMax}
          </p>
        </div>
        <StatusDia veredito={final?.resultado.veredito} />
      </div>
      <Button asChild variant="day" size="lg" className="mt-4 h-12 w-full rounded-xl">
        <Link to="/treino/$dia" params={{ dia: dia.id }}>
          {final ? "VER TREINO ENVIADO" : "ABRIR TREINO"}
        </Link>
      </Button>
    </li>
  );
}

function StatusDia({ veredito }: { veredito: "CERTO" | "ERRADO" | undefined }) {
  if (veredito === "CERTO")
    return <CheckCircle2 aria-label="Certo" className="h-7 w-7 shrink-0 text-success" />;
  if (veredito === "ERRADO")
    return <XCircle aria-label="Errado" className="h-7 w-7 shrink-0 text-destructive" />;
  return <Circle aria-label="Ainda não enviado" className="h-7 w-7 shrink-0 text-muted-foreground" />;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, LoaderCircle, Send, X } from "lucide-react";
import { linkProfessor } from "@/lib/envios";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AvaliacaoHermes } from "@/components/Hermes";
import { ExcluirTreino } from "@/components/ExcluirTreino";
import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enviarFeito, treinoDoAluno } from "@/lib/assessoria.functions";
import { reduzirImagem } from "@/lib/imagem";
import { diaVazio, resumoDia } from "@/lib/treino";

export const Route = createFileRoute("/a/$token/$dia")({
  head: () => ({
    meta: [
      { title: "Treino do dia — Assessoria de Corrida" },
      { name: "description", content: "Detalhes do treino do dia e registro do treino feito." },
      { property: "og:title", content: "Treino do dia — Assessoria de Corrida" },
      { property: "og:description", content: "Detalhes do treino do dia e registro do treino feito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { semana?: string | undefined } => ({ semana: typeof s["semana"] === "string" ? s["semana"] : undefined }),
  component: TreinoDia,
});

function TreinoDia() {
  const { token, dia } = Route.useParams();
  const i = Number(dia);
  const { semana } = Route.useSearch();
  const qc = useQueryClient();
  const buscar = useServerFn(treinoDoAluno);
  const enviar = useServerFn(enviarFeito);
  const { data, isLoading } = useQuery({ queryKey: ["meu", token, semana], queryFn: () => buscar({ data: { token, semana } }), refetchInterval: 1000 });
  const [f, setF] = useState({ km: "", tempo: "", pace: "" });
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const envioEmCurso = useRef(false);
  const resultado = useRef<HTMLDivElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  const d = data?.plano?.[i];
  if (!data || !d || (!d.descanso && diaVazio(d))) return <p className="p-6 text-muted-foreground">Treino não encontrado.</p>;
  const feito = data.feitos.find((x) => x.dia === d.dia);
  const avaliacao = feito?.avaliacao;

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const a = e.target.files?.[0];
    if (!a) return;
    try { setFoto(await reduzirImagem(a)); } catch (err) { toast.error((err as Error).message); }
    e.target.value = "";
  }

  async function mandar(e: React.FormEvent) {
    e.preventDefault();
    if (envioEmCurso.current || enviado) return;
    if (!f.km.trim() || !f.tempo.trim()) { toast.error("Preencha Km e Tempo."); return; }
    envioEmCurso.current = true;
    setEnviando(true);
    try {
      await enviar({ data: { token, semana: data?.semana, dia_index: i, ...f, foto } });
      setEnviado(true);
      toast.success("Treino salvo e enviado para o professor!");
      qc.invalidateQueries({ queryKey: ["meu", token] });
      qc.invalidateQueries({ queryKey: ["aluno"] });
      requestAnimationFrame(() => resultado.current?.scrollIntoView({ behavior: "auto", block: "start" }));
    } catch {
      toast.error("Não deu pra enviar. Tente de novo.");
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md">
      <TopoPagina voltar titulo={d.dia} subtitulo={data.nome} />
      <div className="space-y-4 px-5">
        <section className="rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
          <p className="text-sm font-bold text-paper-muted">O QUE VOCÊ TEM QUE FAZER</p>
          {d.descanso ? (
            <p className="font-display text-4xl leading-none">DESCANSO</p>
          ) : (
            <>
              <p className="font-display text-4xl leading-none">{d.km.replace(".", ",")} KM</p>
              {d.tempo ? <p className="text-xl font-bold">Tempo: {d.tempo}</p> : null}
              <p className="text-xl font-bold">Pace: {d.pace} /km</p>
              <p className="mt-2">{d.detalhes || `Corra ${resumoDia(d)}, mantendo o ritmo constante do começo ao fim.`}</p>
            </>
          )}
        </section>
        {avaliacao ? <div ref={resultado} aria-live="polite"><AvaliacaoHermes avaliacao={avaliacao} /></div> : null}

        {feito && !avaliacao ? <p role="status" className="flex items-center gap-2 text-lg font-bold"><LoaderCircle className="h-6 w-6 shrink-0 animate-spin" /> 🤖 Hermes está analisando seu treino...</p> : null}
        {feito && avaliacao ? <ExcluirTreino id={feito.id} token={token} /> : null}
        {feito ? <Button asChild variant="whatsapp" size="xl" className="h-auto min-h-16 w-full whitespace-normal"><a href={linkProfessor(`Novo treino de ${data.nome} - ${feito.km} km, ${feito.tempo}, ${feito.pace || "-"} /km`)} target="_blank" rel="noopener noreferrer"><Send /> AVISAR O PROFESSOR NO WHATSAPP</a></Button> : null}
        {!d.descanso && !feito && !enviado && data.semana === data.atual ? <form onSubmit={mandar} className="space-y-3 rounded-2xl bg-secondary p-4">
          <p className="font-display text-4xl text-secondary-foreground">REGISTRAR TREINO FEITO</p>
          <div className="grid grid-cols-3 gap-2">
            {(["km", "tempo", "pace"] as const).map((c) => (
              <div key={c} className="space-y-1">
                <Label htmlFor={c}>{c === "km" ? "Km" : c === "tempo" ? "Tempo" : "Pace"}</Label>
                <Input
                  id={c}
                  inputMode={c === "km" ? "decimal" : "text"}
                  placeholder={c === "km" ? "4" : c === "tempo" ? "20:30" : "5:05"}
                  maxLength={10}
                  value={f[c]}
                  onChange={(e) => setF({ ...f, [c]: e.target.value })}
                  className="h-16 text-2xl font-semibold"
                />
              </div>
            ))}
          </div>
          <input ref={arquivo} type="file" accept="image/*" className="hidden" onChange={escolherFoto} aria-label="Foto do treino" />
          <Button type="button" variant="outline" size="xl" className="h-auto min-h-20 w-full whitespace-normal text-xl" onClick={() => arquivo.current?.click()}>
            <Camera className="h-7 w-7 shrink-0" /> TIRAR FOTO DO TREINO / ANEXAR FOTO
          </Button>
          {foto ? (
            <div className="relative">
              <img src={foto} alt="Foto do treino" className="w-full rounded-xl" />
              <Button type="button" variant="outline" size="icon" aria-label="Tirar foto" onClick={() => setFoto(null)} className="absolute right-2 top-2 rounded-full bg-background p-2 text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          <Button type="submit" variant="whatsapp" size="xl" className="h-auto min-h-16 whitespace-normal py-4 text-center" disabled={enviando}>
            <Send className="h-6 w-6 shrink-0" /> {enviando ? "ENVIANDO..." : "ENVIAR PRO PROFESSOR"}
          </Button>
        </form> : null}
      </div>
    </main>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AvaliacaoHermes } from "@/components/Hermes";
import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enviarFeito, treinoDoAluno } from "@/lib/assessoria.functions";
import { reduzirImagem } from "@/lib/imagem";
import { diaVazio, resumoDia, type AvaliacaoSalva } from "@/lib/treino";

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
  component: TreinoDia,
});

function TreinoDia() {
  const { token, dia } = Route.useParams();
  const i = Number(dia);
  const qc = useQueryClient();
  const buscar = useServerFn(treinoDoAluno);
  const enviar = useServerFn(enviarFeito);
  const { data, isLoading } = useQuery({ queryKey: ["meu", token], queryFn: () => buscar({ data: { token } }) });
  const [f, setF] = useState({ km: "", tempo: "", pace: "" });
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState<AvaliacaoSalva | null>(null);
  const envioEmCurso = useRef(false);
  const resultado = useRef<HTMLDivElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  const d = data?.plano?.[i];
  if (!data || !d || (!d.descanso && diaVazio(d))) return <p className="p-6 text-muted-foreground">Treino não encontrado.</p>;
  const avaliacao = avaliacaoEnviada ?? data.feitos.find((x) => x.dia === d.dia)?.avaliacao;

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const a = e.target.files?.[0];
    if (!a) return;
    try { setFoto(await reduzirImagem(a)); } catch (err) { toast.error((err as Error).message); }
    e.target.value = "";
  }

  async function mandar(e: React.FormEvent) {
    e.preventDefault();
    if (envioEmCurso.current || avaliacaoEnviada) return;
    if (!f.km.trim() || !f.tempo.trim()) { toast.error("Preencha Km e Tempo."); return; }
    envioEmCurso.current = true;
    setEnviando(true);
    try {
      const resposta = await enviar({ data: { token, dia_index: i, ...f, foto } });
      setAvaliacaoEnviada(resposta.avaliacao);
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

        {!d.descanso && !avaliacaoEnviada ? <form onSubmit={mandar} className="space-y-3 rounded-2xl bg-secondary p-4">
          <p className="font-display text-2xl text-secondary-foreground">REGISTRAR TREINO FEITO</p>
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
                  className="h-12 text-lg font-semibold"
                />
              </div>
            ))}
          </div>
          <input ref={arquivo} type="file" accept="image/*" className="hidden" onChange={escolherFoto} aria-label="Foto do treino" />
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => arquivo.current?.click()}>
            <Camera /> TIRAR FOTO DO TREINO / ANEXAR FOTO
          </Button>
          {foto ? (
            <div className="relative">
              <img src={foto} alt="Foto do treino" className="w-full rounded-xl" />
              <button type="button" aria-label="Tirar foto" onClick={() => setFoto(null)} className="absolute right-2 top-2 rounded-full bg-background p-2 text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          <Button type="submit" variant="whatsapp" size="xl" className="h-auto min-h-16 whitespace-normal py-4 text-center" disabled={enviando}>
            <Send className="h-6 w-6 shrink-0" /> {enviando ? "SALVANDO E AVALIANDO..." : "SALVA E ENVIA PRO PROFESSOR"}
          </Button>
        </form> : null}
      </div>
    </main>
  );
}

import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Pencil, Send, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Robozinho, type EstadoRobo } from "@/components/Robozinho";
import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHAVES, useEnvio, useGuardado } from "@/lib/armazenamento";
import {
  DADOS_VAZIOS,
  linkProfessor,
  montarMensagem,
  podeCorrigir,
  type Dados,
  type EnvioDia,
  type Tentativa,
} from "@/lib/envios";
import { dataUrlParaArquivo, reduzirImagem } from "@/lib/imagem";
import { acharDia, chaveSemana, dataCurta, dataDoDia } from "@/lib/plano";
import { conferirTreino } from "@/lib/robo.functions";

export const Route = createFileRoute("/treino/$dia")({
  loader: ({ params }) => {
    const dia = acharDia(params.dia);
    if (!dia) throw notFound();
    return { dia };
  },
  head: ({ loaderData }) => {
    const nome = loaderData?.dia.nome ?? "Treino";
    const titulo = `Treino de ${nome} — Circuito Jaua`;
    const desc = loaderData
      ? `${loaderData.dia.meta.titulo}: ${loaderData.dia.meta.km} km. Preencha, mande a foto e o robô confere.`
      : "Preencha o treino, mande a foto e o robô confere.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Treino,
});

function Treino() {
  const { dia } = Route.useLoaderData();
  const conferir = useServerFn(conferirTreino);

  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => setHoje(new Date()), []);
  const semana = hoje ? chaveSemana(hoje) : "carregando";

  const [envio, setEnvio, envioOk] = useEnvio(semana, dia.id);
  const [nomeAluno] = useGuardado<string>(CHAVES.nome, "Luiz");

  const [dados, setDados] = useState<Dados>(DADOS_VAZIOS);
  const [foto, setFoto] = useState<string | null>(null);
  const [corrigindo, setCorrigindo] = useState(false);
  const [estado, setEstado] = useState<EstadoRobo>({ tipo: "esperando" });
  const inputFoto = useRef<HTMLInputElement>(null);
  const robo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (envio) setEstado({ tipo: "pronto", antes: envio.antes, depois: envio.depois });
    else setEstado({ tipo: "esperando" });
  }, [envio]);

  const mostrandoFormulario = envioOk && (!envio || corrigindo);
  const enviando = estado.tipo === "conferindo";
  const data = hoje ? dataCurta(dataDoDia(dia.id, hoje)) : "";

  function mudar<K extends keyof Dados>(campo: K, valor: Dados[K]) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function escolherFoto(arquivo?: File) {
    if (!arquivo) return;
    try {
      setFoto(await reduzirImagem(arquivo));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu pra usar essa foto.");
    }
  }

  function comecarCorrecao() {
    if (!envio || !podeCorrigir(envio)) return;
    setDados(envio.antes.dados);
    setFoto(envio.antes.foto);
    setCorrigindo(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.km || !dados.tempo || !dados.pace) {
      toast.error("Preenche Km, Tempo e Pace.");
      return;
    }
    if (!foto) {
      toast.error("Falta a foto do relógio ou do Strava.");
      return;
    }
    if (corrigindo && !podeCorrigir(envio)) {
      toast.error("Tu já usou a tua correção.");
      return;
    }

    setEstado({ tipo: "conferindo", foto });
    setTimeout(() => robo.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    try {
      const resp = await conferir({ data: { meta: dia.meta, dados, foto } });
      if (!resp.ok) {
        setEstado({ tipo: "erro", mensagem: resp.erro });
        return;
      }
      const tentativa: Tentativa = { dados, foto, resultado: resp.resultado, em: new Date().toISOString() };
      const novo: EnvioDia = corrigindo && envio ? { antes: envio.antes, depois: tentativa } : { antes: tentativa };
      if (!setEnvio(novo)) {
        toast.error("O celular está sem espaço pra guardar o treino.");
      }
      setCorrigindo(false);
      setDados(DADOS_VAZIOS);
      setFoto(null);
      toast.success("Robô conferiu! Agora manda pro professor.");
    } catch {
      setEstado({ tipo: "erro", mensagem: "Sem internet ou o robô não respondeu. Tenta de novo." });
    }
  }

  const mensagem = envio
    ? montarMensagem({ nomeAluno, diaNome: dia.nome, data, meta: dia.meta, envio })
    : "";

  async function mandarFotos() {
    if (!envio) return;
    try {
      const arquivos = [await dataUrlParaArquivo(envio.antes.foto, `${dia.id}-antes.jpg`)];
      if (envio.depois) arquivos.push(await dataUrlParaArquivo(envio.depois.foto, `${dia.id}-depois.jpg`));
      if (!navigator.canShare?.({ files: arquivos })) {
        toast.error("Esse celular não deixa mandar a foto daqui. Manda pelo WhatsApp mesmo.");
        return;
      }
      await navigator.share({ files: arquivos, text: mensagem });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error("Não deu pra compartilhar a foto.");
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-5 pb-12">
      <TopoPagina
        voltarPara="/semana"
        titulo={
          <>
            {dia.nome.toUpperCase()} <span className="text-primary">{data}</span>
          </>
        }
        subtitulo={dia.meta.titulo}
      />

      <section className="mx-5 rounded-3xl bg-sunset p-5 text-primary-foreground shadow-glow">
        <p className="font-display text-lg opacity-80">TREINO DO PROFESSOR</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Meta rotulo="KM" valor={String(dia.meta.km)} />
          <Meta rotulo="TEMPO" valor={dia.meta.tempo} />
          <Meta rotulo="PACE" valor={dia.meta.pace} />
        </div>
        <p className="mt-3 text-sm font-semibold">{dia.meta.dica}</p>
      </section>

      {mostrandoFormulario ? (
        <form onSubmit={enviar} className="mx-5 space-y-5">
          {corrigindo ? (
            <p className="rounded-xl bg-accent p-3 text-sm font-semibold text-accent-foreground">
              Corrigindo o treino — tu só tem essa 1 chance. O professor vai ver o antes e o depois.
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            <Campo id="km" rotulo="Km" placeholder="6,2" modo="decimal" valor={dados.km} onChange={(v) => mudar("km", v)} />
            <Campo id="tempo" rotulo="Tempo" placeholder="36:10" modo="text" valor={dados.tempo} onChange={(v) => mudar("tempo", v)} />
            <Campo id="pace" rotulo="Pace" placeholder="5:50" modo="text" valor={dados.pace} onChange={(v) => mudar("pace", v)} />
          </div>


          <div>
            <p className="mb-2 text-base font-semibold">Foto do relógio / Strava</p>
            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              className="grid min-h-40 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-input bg-muted text-muted-foreground"
            >
              {foto ? (
                <img src={foto} alt="Foto do relógio" className="max-h-80 w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 p-6 font-semibold">
                  <ImagePlus className="h-10 w-10 text-primary" />
                  Toca aqui pra mandar a foto
                </span>
              )}
            </button>
            {foto ? (
              <button type="button" onClick={() => inputFoto.current?.click()} className="mt-2 text-sm font-semibold text-primary">
                Trocar foto
              </button>
            ) : null}
            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                escolherFoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <Button type="submit" variant="hero" size="xl" disabled={enviando}>
            <Send className="h-6 w-6" />
            {enviando ? "CONFERINDO…" : corrigindo ? "ENVIAR CORREÇÃO" : "ENVIAR TREINO"}
          </Button>
          {corrigindo ? (
            <Button type="button" variant="ghost" className="w-full" onClick={() => setCorrigindo(false)}>
              Cancelar correção
            </Button>
          ) : null}
        </form>
      ) : null}

      <div ref={robo} className="mx-5 scroll-mt-4 space-y-3">
        <Robozinho estado={estado} />

        {envio && !corrigindo && estado.tipo !== "conferindo" ? (
          <div className="space-y-3">
            <Button asChild variant="whatsapp" size="xl">
              <a href={linkProfessor(mensagem)} target="_blank" rel="noreferrer">
                <Send className="h-6 w-6" />
                {envio.depois ? "AVISAR PROFESSOR (ANTES E DEPOIS)" : "MANDAR PRO PROFESSOR"}
              </a>
            </Button>
            <Button type="button" variant="outline" className="h-12 w-full rounded-xl" onClick={mandarFotos}>
              <Share2 /> Mandar a foto também
            </Button>
            {podeCorrigir(envio) ? (
              <Button type="button" variant="day" size="lg" className="h-14 w-full rounded-xl" onClick={comecarCorrecao}>
                <Pencil /> CORRIGIR TREINO (1 CHANCE)
              </Button>
            ) : null}
            {envio.depois ? (
              <p className="text-center text-sm text-muted-foreground">Tu já usou a tua correção.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Meta({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-background/15 py-2">
      <p className="font-display text-2xl leading-none">{valor}</p>
      <p className="mt-1 text-[10px] font-bold tracking-wider">{rotulo}</p>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  placeholder,
  modo,
  valor,
  onChange,
}: {
  id: string;
  rotulo: string;
  placeholder: string;
  modo: "decimal" | "numeric" | "text";
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-base">
        {rotulo}
      </Label>
      <Input
        id={id}
        inputMode={modo}
        placeholder={placeholder}
        value={valor}
        maxLength={12}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 text-xl font-semibold"
      />
    </div>
  );
}

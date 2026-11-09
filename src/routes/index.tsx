import { Link, createFileRoute } from "@tanstack/react-router";
import { Camera, Settings } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import fotoPadrao from "@/assets/aluno-padrao.jpg";
import { Button } from "@/components/ui/button";
import { CHAVES, useGuardado } from "@/lib/armazenamento";
import { reduzirImagem } from "@/lib/imagem";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Circuito Jaua — Meu treino" },
      { name: "description", content: "Abra o treino da semana do Circuito Jaua e mande pro professor." },
      { property: "og:title", content: "Circuito Jaua — Meu treino" },
      { property: "og:description", content: "Abra o treino da semana do Circuito Jaua e mande pro professor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const [foto, setFoto] = useGuardado<string | null>(CHAVES.foto, null);
  const [nome] = useGuardado<string>(CHAVES.nome, "Luiz");
  const input = useRef<HTMLInputElement>(null);

  async function trocarFoto(arquivo?: File) {
    if (!arquivo) return;
    try {
      const url = await reduzirImagem(arquivo, 900, 0.85);
      if (!setFoto(url)) toast.error("Não deu pra guardar a foto. Tenta uma menor.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu pra trocar a foto.");
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={foto ?? fotoPadrao}
          alt={`Foto do aluno ${nome}`}
          width={864}
          height={1152}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-night-fade" />
      </div>

      <header className="relative z-10 flex items-center justify-between p-5">
        <span className="font-display text-2xl text-foreground drop-shadow">
          CIRCUITO <span className="text-primary">JAUA</span>
        </span>
        <Link
          to="/ajustes"
          aria-label="Ajustes"
          className="grid h-11 w-11 place-items-center rounded-full bg-background/60 text-foreground backdrop-blur"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <div className="relative z-10 mt-auto space-y-5 p-5 pb-10">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-background/60 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur"
        >
          <Camera className="h-4 w-4" /> Trocar minha foto
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => trocarFoto(e.target.files?.[0])}
        />

        <h1 className="text-6xl text-foreground drop-shadow-lg">
          Bora, <span className="text-primary">{nome || "atleta"}</span>!
        </h1>

        <Button asChild variant="hero" size="xl">
          <Link to="/semana">VER TREINO DA SEMANA</Link>
        </Button>
      </div>
    </main>
  );
}

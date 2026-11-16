import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarProfessor, verProfessor } from "@/lib/assessoria.functions";
import { PROFESSOR_PADRAO } from "@/lib/envios";

export function CadastroProfessor() {
  const ver = useServerFn(verProfessor);
  const salvar = useServerFn(salvarProfessor);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["professor"], queryFn: () => ver() });
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState(PROFESSOR_PADRAO);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (data) { setNome(data.nome); setWhats(data.whatsapp || PROFESSOR_PADRAO); } }, [data]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    try { await salvar({ data: { nome, whatsapp: whats } }); toast.success("Professor salvo."); qc.invalidateQueries({ queryKey: ["professor"] }); }
    catch { toast.error("Preencha nome e WhatsApp do professor."); }
    finally { setSalvando(false); }
  }

  return (
    <form onSubmit={enviar} className="space-y-2 rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
      <p className="font-display text-2xl">CADASTRO DO PROFESSOR</p>
      <div className="space-y-1"><Label htmlFor="prof-nome">Nome do professor</Label><Input id="prof-nome" maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor="prof-whats">WhatsApp do professor</Label><Input id="prof-whats" inputMode="tel" maxLength={20} value={whats} onChange={(e) => setWhats(e.target.value)} /></div>
      <Button type="submit" variant="hero" className="w-full" disabled={salvando}>{salvando ? "SALVANDO..." : "SALVAR"}</Button>
    </form>
  );
}

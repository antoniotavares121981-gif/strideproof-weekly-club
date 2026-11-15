import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Pedido = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function SalvarTelaInicial() {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [instalado, setInstalado] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalado(true);
    const guardar = (e: Event) => { e.preventDefault(); setPedido(e as Pedido); };
    window.addEventListener("beforeinstallprompt", guardar);
    return () => window.removeEventListener("beforeinstallprompt", guardar);
  }, []);
  if (instalado) return null;
  async function salvar() {
    if (pedido) { await pedido.prompt(); const r = await pedido.userChoice; if (r.outcome === "accepted") setInstalado(true); setPedido(null); return; }
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast(iphone ? "No iPhone: aperte em Compartilhar (quadrado com seta) e depois em \"Adicionar à Tela de Início\"." : "Aperte nos 3 pontinhos do navegador e depois em \"Adicionar à tela inicial\".", { duration: 10000 });
  }
  return <Button variant="outline" size="xl" className="h-auto min-h-16 w-full whitespace-normal text-xl" onClick={salvar}><Smartphone className="h-6 w-6" /> SALVAR NA TELA INICIAL</Button>;
}

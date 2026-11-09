/** Diminui a foto para caber no celular e ir rápido pro robô. */
export async function reduzirImagem(arquivo: File, ladoMax = 1280, qualidade = 0.82): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolhe uma foto (imagem), por favor.");
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Não consegui abrir essa foto. Tenta outra."));
      i.src = url;
    });
    const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
    const w = Math.round(img.width * escala);
    const h = Math.round(img.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não consegui preparar a foto.");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", qualidade);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function dataUrlParaArquivo(dataUrl: string, nome: string): Promise<File> {
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  return new File([blob], nome, { type: blob.type || "image/jpeg" });
}

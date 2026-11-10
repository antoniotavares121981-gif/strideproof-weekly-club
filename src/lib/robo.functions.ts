import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { conferirComRobo } from "./robo.server";

const Entrada = z.object({
  meta: z.object({
    titulo: z.string().max(100),
    km: z.number(),
    tempo: z.string().max(20),
    pace: z.string().max(20),
    dica: z.string().max(300),
  }),
  dados: z.object({
    km: z.string().max(20),
    tempo: z.string().max(20),
    pace: z.string().max(20),
  }),
  foto: z
    .string()
    .startsWith("data:image/", "A foto precisa ser uma imagem.")
    .max(6_000_000, "Foto grande demais."),
});

export const conferirTreino = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Entrada.parse(d))
  .handler(async ({ data }) => conferirComRobo(data.meta, data.dados, data.foto));

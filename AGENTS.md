<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Students, their 3-day plan (draft + sent copy) and finished workouts live in Lovable Cloud; tables have no RLS policies and are reached only via server functions in `src/lib/assessoria.functions.ts` (admin client) so a student only sees data through their own secret link token.
- Student view lives under `/a/$token` (no login); professor view has no password by user choice. A plan becomes visible to the student only when copied to `plano_enviado` by ENVIAR.
- Hermes evaluation, WhatsApp links and message text are pure functions in `src/lib/envios.ts`, covered by `src/test/envios.test.ts`.
- WhatsApp sending is a client-side `wa.me` link (professor number fixed; student number per student).
- Bottom menu lives in `src/components/MenuBaixo.tsx`, mounted once in `__root.tsx`.
- Reuse the student panel on home and the student-list route so both share registration state and the synchronous submission lock against duplicate taps.

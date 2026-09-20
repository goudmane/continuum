# Continuum

A personal task workspace with optional notebooks and work sessions. Projects and tasks deliberately have no environment model.

## Run locally

Requires Node.js 22.13+ and the pnpm version declared in package.json.

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_funny_blindfold.sql
pnpm dev
```

Apply each migration only once to a local database. Production migrations are managed by Sites. The generated Cloudflare Worker needs a D1 binding named `DB`. No external AI, email, or API keys are required; `.env.example` documents the runtime contract.

The portable execution profile includes the starter's loopback-only mock sign-in at `/signin-with-chatgpt?return_to=/`. The managed execution profile does not simulate identity: anonymous preview visitors see a clearly labeled, temporary example workspace. On the private deployed Site, ChatGPT supplies authenticated identity. A new authenticated user starts with an empty workspace and can explicitly load sample data.

## Everyday use

- Capture a task with only a title, from New task or the inline capture field.
- Use Today, Inbox, Upcoming, All tasks, or individual projects.
- Planning a task today never changes its deadline.
- List and board share search, status/priority filters, sorting, and saved data.
- Use row checkboxes for bulk completion, planning, archiving, and moving projects.
- Open a task for its description, checklist, progress, blocker, and next action.
- Notebooks are optional. Entries support headings, lists, checkbox notation, safe links, and fenced code with language labels and copy controls.
- Work sessions can be started, ended, logged manually, and corrected. Only one session can be active per user. Ending a session updates resume context.
- Task deletion moves it to Trash; restoration retains notes and sessions. No permanent delete operation is exposed.
- Archive projects through Projects → Edit. Archived projects and their tasks remain accessible through Archive and Projects.
- Change theme from the sidebar. Keyboard shortcuts: N for capture, Ctrl/Cmd+K for search, Ctrl/Cmd+B for sidebar.

Task edits use an explicit Save changes action. Notebook drafts have Save note. Saving state and failures are shown; no durable success is reported before acknowledgement. Unsaved task and note drafts are kept in this tab's session storage, scoped by user. Failed whole-workspace writes are preserved for retry or JSON download. Session storage is a recovery aid, not authoritative persistence.

## Implementation

- TypeScript, React, Vinext, Tailwind, and accessible Radix/Shadcn controls.
- Cloudflare D1 persistence; Drizzle owns schema migrations.
- `lib/domain/workspace.ts`: separately typed Task, Project, Note, and Session entities plus domain validation.
- `db/workspaces.ts`: parameterized persistence and atomic optimistic concurrency.
- `app/api/workspace/route.ts`: authentication, origin check, payload validation, and user-scoped access.
- `lib/use-workspace.ts`: client persistence, error and recovery states.
- `components/task-detail.tsx`: optional notebook and session editor.
- `components/workspace-parts.tsx`: safe note rendering and shared UI.

A versioned row stores each user's personal workspace as a JSON aggregate. This makes task/session changes atomic and prevents cross-tab lost updates through compare-and-swap revisions. Different users have different primary keys; clients cannot choose an owner in request bodies. All data is read and saved through the authenticated API. Limits: 1 MB per workspace, 2,000 tasks, 100 projects, 3,000 notes, 5,000 sessions. This is suited to a personal workspace; large team collaboration would warrant normalized storage and incremental APIs.

Hosted access relies on Sites stripping untrusted identity headers and injecting verified `oai-authenticated-user-id`. Do not expose the raw Worker or a self-hosted copy publicly without an authentication gateway that provides the same guarantee. Email is display-only. This app is not a zero-knowledge vault; do not treat task notes as encrypted password storage.

Date-only deadlines and plans remain YYYY-MM-DD values. Sessions use UTC ISO timestamps and display in the browser's local timezone. Notes never render raw HTML and never execute code.

## Reference projects inspected

- `goudmane/BringMeBack`, master: API ItemController and repository tree show separate request validation, actions, resources, and authorization policies. Continuum applies the same separation of concerns in its domain, API, and persistence layers.
- `goudmane/vaultbook`, master: `apps/web/app/pages/index.vue` and `assets/css/main.css` informed the compact sidebar, search-first workspace, focused editors, and restrained violet accent.

No source from either reference repository was copied. The preferred Nuxt/PrimeVue/Laravel stack was adapted to the available Sites Worker runtime, which cannot host a PHP Laravel server. These are pattern references, not dependencies.

## Verify

```sh
pnpm exec tsc --noEmit
pnpm build
node tests/run-local.mjs
```

The local integration test starts the built Worker, uses synthetic identities in local development only, and verifies authentication, owner isolation, persistence, date separation, one active session, invalid references, concurrent/stale revisions, notebook retention, and soft deletion/restoration. It never contacts a deployed Site. Test records are isolated with random synthetic user IDs in the local D1 database.

See `docs/VERIFICATION.md` for the recorded checks and limitations. The source includes feature-detected WebMCP tools for listing visible tasks and creating a task via the same validated save flow.

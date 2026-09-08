# Agent Engineering Policy

## Authority

User instructions are the highest-priority project-specific authority.
Skills provide guidance; they do not grant permission to change scope, rewrite unrelated code, delete files, or alter existing behavior.

## Required workflow

1. Understand the user's exact request.
2. Inspect the relevant existing code, configuration, and tests before editing.
3. State the intended scope and plan when the change is non-trivial.
4. Change only what is necessary to satisfy the request.
5. Preserve existing features, APIs, UI behavior, data flow, and working code unless the user explicitly asks for a change.
6. Validate the changed area with the smallest relevant checks.
7. Report exactly what changed, what was verified, and any remaining issue.

## Scope control

- Do not proactively refactor, redesign, rename, reorganize, optimize, or modernize unrelated code.
- Do not fix unrelated issues merely because they are discovered during the task.
- Do not add dependencies, files, abstractions, or features unless they are required by the user's request or explicitly approved.
- Do not replace working implementations with a preferred alternative without user approval.
- Prefer minimal, targeted diffs over broad rewrites.

## Analysis before action

- Do not edit blindly.
- First identify the relevant files and understand their current behavior.
- For bug fixes, identify the likely cause and verify it against the code before changing it.
- If the request is ambiguous in a way that could change scope or behavior, ask before making that change. Otherwise proceed with the narrowest reasonable interpretation.

## Skill invocation

- Skills are scoped tools, not global instructions.
- Use a skill only when its purpose directly matches the user's request.
- Prefer explicit invocation for documentation, archival, recording, publishing, and other side-effect-heavy skills.
- A skill must never be interpreted as permission to perform destructive or unrelated actions.
- If a skill conflicts with this policy or the user's instruction, follow the higher-priority instruction and keep the scope minimal.

## Destructive operations

Deletion, irreversible data changes, history rewriting, mass replacement, and changes outside the requested scope require explicit user approval unless the user directly requested that exact destructive action.

## Code quality

- Preserve existing conventions unless they are part of the requested change.
- Avoid speculative abstractions and AI-generated filler.
- Keep comments and documentation concise and useful.
- Do not expose hidden chain-of-thought or internal reasoning; provide concise conclusions, evidence, and verification results instead.

## Completion standard

A task is complete only when the requested change is implemented and the relevant validation has been run or its limitation is clearly reported.

## Skill proyek (SKILL.md)

Skill panduan proyek ini ada di `.agents/skills/` dan diduplikasi ke `.opencode/skills/`
(isi identik; opencode membaca keduanya). Muat skill sesuai area kerja:

| Skill | Muat saat |
| ----- | --------- |
| `kci-frontend` | mengubah `src/`, `index.html`, `vite.config.js`, atau `public/` |
| `kci-backend` | mengubah `server/`, `api/`, `db/`, atau alur data/auth backend |
| `kci-pengujian` | menyelesaikan perubahan apa pun, menambah uji, atau menyelidiki CI merah |
| `kci-deploy` | mengubah `vercel.json`, `render.yaml`, workflow deploy, atau env var |

Catatan: panduan proyek lain (Better Auth, DSH/DeepSeek Harness) sudah dihapus dari repo.
Jangan mengikuti dokumen lama yang menyebut SvelteKit, Better Auth, MongoDB, atau OpenRouter —
bukan bagian dari proyek ini.

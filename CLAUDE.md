# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online game platform where players compete for highest score. Early stage — still the Create Next App scaffold (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`). `references/` is empty.

README says project follows Spec Driven Design (`/spec` and `/spec-impl` skills, installed via `npx skills@latest add Klerith/fernando-skills`).

## Commands

- `npm run dev` — dev server (localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner configured yet.

## UI work

- Para cualquier tarea de desarrollo de interfaces (páginas, componentes, layouts, estilos, diseño visual, accesibilidad, responsive), usar las skills instaladas globalmente `frontend-design` y `ui-ux-pro-max` vía Skill tool antes de escribir código UI.

## Stack / gotchas

- Next.js 16.4.5, React 19.3, App Router (`app/`), TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`, theme via `@theme inline`; no tailwind config file).
- Per `AGENTS.md`: this Next.js version has breaking changes vs. training data. Read relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next code; heed deprecations.

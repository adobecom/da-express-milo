# PDP Page Gen

Upload a CSV file or paste a list of IDs, then generate DA (Document Authoring) docs from those IDs.

## Tech stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (@tailwindcss/vite)
- **TanStack React Query**

## Scripts

- `npm run dev` — start dev server (port 3001)
- `npm run proxy` — build and run local Koa proxy for Zazzle API (port 3002); run this alongside `dev` to avoid CORS
- `npm run build` — typecheck + production build
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

## Build output

Built assets are output to `dist/` and intended to be served at `/tools/pdp-page-gen/dist/` (e.g. on AEM).

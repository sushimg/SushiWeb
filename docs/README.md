# Sushi Systems — Website

Marketing site for Sushi Systems, built with React 19, TypeScript, Vite and
Tailwind CSS. Multi-language (EN / NO / TR), light/dark theme, client-side
routing via React Router.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build locally
npm run lint     # run ESLint
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values used by the contact form
and newsletter signup:

- `VITE_WEB3FORMS_KEY` — Web3Forms access key (option A), **or**
- `VITE_CONTACT_ENDPOINT` — a custom JSON POST endpoint such as Formspree (option B)

The Instagram embed in the "Latest News" section is hardcoded in
`src/sections/LatestNews.tsx` (`INSTAGRAM_PERMALINK`) — paste an individual
post/reel permalink there.

## Deployment

Deploys to Vercel as a static SPA. `vercel.json` rewrites all routes to
`index.html` so client-side routes (e.g. `/about`, `/projects/...`) resolve on
direct load and refresh. Set the environment variables above in the Vercel
project settings.

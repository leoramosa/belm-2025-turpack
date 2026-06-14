This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Variables de entorno (SEO y dominio)

En la raíz del proyecto crea `.env.local` (no lo subas al repositorio) o define las variables en el panel de tu hosting (p. ej. Vercel → Settings → Environment Variables).

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | URL canónica del sitio sin barra final, p. ej. `https://www.belm.pe`. Ver `src/lib/site.ts`. |
| `GOOGLE_SITE_VERIFICATION` | Valor del código de verificación de Google Search Console (solo el contenido del atributo `content` de la meta). Se aplica en `src/app/layout.tsx` vía `metadata.verification.google`. |

Tras cambiar variables en producción, hace falta un nuevo deploy. En local, reinicia el servidor de desarrollo.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

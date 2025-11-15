# Taman Flora Terapung

Admin Dashboard UI built on Shadcn UI and Vite, configured for Cloudflare Pages with D1 and R2.

![Dashboard](public/images/shadcn-admin.png)

## Features

- Light/dark mode
- Responsive and accessible
- Built-in Sidebar
- Global search command
- 10+ pages
- Extra custom components
- RTL support

## Tech Stack

- UI: ShadcnUI (TailwindCSS + RadixUI)
- Build Tool: Vite
- Router: TanStack Router
- TypeScript
- ESLint & Prettier
- Icons: Lucide & Tabler

## Local Development

```bash
yarn install
yarn dev
```

## Cloudflare Pages Deployment

This project includes Cloudflare Pages Functions and bindings for D1 and R2.

### Configure Bindings

Edit `wrangler.toml`:

- Set `name` to the project slug (already `taman-flora-terapung`).
- In `[[d1_databases]]`, set `database_id` to your D1 database ID.
- In `[[r2_buckets]]`, set `bucket_name` to your R2 bucket name.

You can also configure bindings in the Cloudflare Pages dashboard under Settings → Environment Variables & Bindings.

### Build and Publish

```bash
yarn build
yarn cf:publish
```

`cf:publish` publishes the built `dist` directory to Cloudflare Pages: `taman-flora-terapung`.

### Local Pages Dev (Simulated D1/R2)

```bash
yarn build
yarn cf:dev
```

Runs a local server at `http://localhost:8788/` with simulated D1 and R2.

## API Endpoints

- `GET /api/health` → `{ "status": "ok" }`
- `GET /api/d1` → `{ "ok": true }` (simple D1 reachability)
- `PUT /api/r2/[key]` store an object
- `GET /api/r2/[key]` retrieve an object

Example:

```bash
curl -X PUT -H "content-type: text/plain" --data-binary "hello" \
  https://<your-pages-domain>/api/r2/test.txt

curl https://<your-pages-domain>/api/r2/test.txt
```

## License

MIT
# BindLab AI

BindLab AI is a Next.js app. Local development runs on port `3003`.

## Start The Site Locally

Install dependencies once:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3003
```

The `dev` script is fixed to:

```bash
next dev -H 0.0.0.0 -p 3003
```

Because the port is explicit, Next.js should fail clearly if port `3003` is already occupied instead of silently switching to another port.

If your machine blocks binding to `0.0.0.0`, use:

```bash
npx next dev -H 127.0.0.1 -p 3003
```

## Check If The Server Is Running

```bash
npm run check:server
```

or:

```bash
lsof -i :3003
```

If the server is running, you should see a `node` process listening on port `3003`.

## When `ERR_CONNECTION_REFUSED` Appears

`localhost` only works while the local dev server process is running. If the Mac sleeps, the terminal closes, or the Node process hangs, Chrome may show:

```text
localhost refused to connect
ERR_CONNECTION_REFUSED
```

Restart the local server:

```bash
npm run restart
```

If you want to do it manually:

```bash
lsof -i :3003
kill -9 <PID>
npm run dev
```

Replace `<PID>` with the process ID shown by `lsof`.

## Production Preview Locally

Build the app:

```bash
npm run build
```

Preview the production build on port `3003`:

```bash
npm run preview
```

Open:

```text
http://localhost:3003
```

## AI Environment Variables

Create `.env.local` from `.env.example` and set:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemma-4-31b-it
GEMINI_FALLBACK_MODEL=gemini-flash-latest
```

If the Gemini key is missing, invalid, or quota-limited, the app should keep loading and show a friendly in-page error instead of crashing the whole local server.

## Useful Debug Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run check:server
lsof -i :3003
kill -9 <PID>
npx next dev -H 0.0.0.0 -p 3003
npx next dev -H 127.0.0.1 -p 3003
```

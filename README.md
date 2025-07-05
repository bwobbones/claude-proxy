# Claude Proxy (Vercel Serverless)

A secure, rate-limited proxy for Anthropic Claude API requests, with logging and simple authentication. Designed for use with mobile or web apps.

## Features

- Keeps Claude API key secret
- Rate limiting (10 requests/minute per IP)
- Simple API key authentication for your app
- Logging of prompts and errors
- Ready for Vercel serverless deployment

## Setup

1. Clone this repo or copy the `claude-proxy` folder.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file with:
   ```env
   CLAUDE_API_KEY=sk-...           # Your Claude/Anthropic API key
   CLIENT_API_KEY=your-app-secret  # Your own secret for mobile app auth
   ```
4. Deploy to Vercel (or run locally with `vercel dev`).

## Usage

- **Endpoint:** `POST /api/claude`
- **Headers:** `x-client-key: your-app-secret`
- **Body:** `{ "prompt": "Tell me about Cupertino, CA" }`

## Example curl

```
curl -X POST https://your-vercel-app.vercel.app/api/claude \
  -H "x-client-key: your-app-secret" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me about Cupertino, CA"}'
```

## Notes

- You can add more Claude API parameters as needed in `api/claude.js`.
- Adjust rate limiting in `api/claude.js` as needed.
- Never expose your Claude API key to the client/mobile app.

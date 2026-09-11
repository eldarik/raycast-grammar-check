# Grammar Check — Raycast Extension

A Raycast extension that checks grammar and style of selected or clipboard text using the Claude Code CLI.

## Features

- **Fast grammar & style checking** — runs the Claude Code CLI locally
- **Selection or clipboard input** — tries to grab selected text first, falls back to clipboard
- **Side-by-side view** — shows original and corrected text
- **Copy/Paste actions** — easily copy the corrected text back to clipboard or paste into the active app

## Setup

### 1. Prerequisites

- Raycast installed on macOS
- Claude Code CLI installed (in your PATH, typically `~/.local/bin/claude`)
- Claude subscription (for API access)

### 2. Create OAuth Token

Generate a long-lived OAuth token:

```bash
claude setup-token
```

This will walk you through authentication and output a token that looks like:
```
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
```

### 3. Configure the Extension

Create `.env` file with your token:

```bash
echo "CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-YOUR_TOKEN_HERE" > .env
```

Or copy from the example:

```bash
cp .env.example .env
# Then edit .env and paste your token
```

### 4. Start Development

```bash
npm install
npm run dev
```

Raycast will automatically load the extension. The token is automatically loaded from `.env`.

### 5. Test

1. In Raycast, search for "Check Grammar & Style"
2. Select some text or copy to clipboard
3. Run the command
4. See the corrected text in the result view
5. Copy or paste the corrected text back

### 6. Bind a Hotkey (Optional)

1. Run the command once in Raycast
2. Press ⌘K to open the Action Panel
3. Select "Configure Command"
4. Click "Record Hotkey" to bind a global keyboard shortcut (e.g., `⌥⌘G`)

## Build & Install

To install the extension permanently (no dev server needed):

```bash
npm run build
```

Then open Raycast and search for "Check Grammar & Style" — it will now be available globally.

## Files

- `.env` — stores your `CLAUDE_CODE_OAUTH_TOKEN` (gitignored)
- `.env.example` — template showing what `.env` should contain
- `src/check-grammar.tsx` — main extension code
- `package.json` — dependencies and scripts
- `tsconfig.json` — TypeScript config

## Troubleshooting

### Token not loading

- Check that `.env` exists in the extension directory
- Make sure the token is set: `cat .env`
- Restart `npm run dev`
- Check the logs for `CLAUDE_CODE_OAUTH_TOKEN: ***SET***`

### "Not logged in" error

- Run `claude setup-token` again to refresh your token
- Update `.env` with the new token
- Restart dev mode

### Accessibility permission denied

The extension tries to get selected text from the active app (requires Accessibility permission):
- System Settings → Privacy & Security → Accessibility → allow Raycast
- Without this, it falls back to clipboard (no error, just a graceful fallback)

## Development

### Logs

Logs appear in the terminal where you ran `npm run dev`. Look for lines starting with `[Grammar Check Extension]` or `[Claude Grammar Check]`.

### Editing

- Modify `src/check-grammar.tsx` to change the extension
- Rebuild: `npm run build`
- Dev mode auto-reloads on changes

### Dependencies

- `@raycast/api` — Raycast SDK for UI and system integration
- `dotenv-cli` — loads `.env` file for development
- TypeScript — for type safety

## License

MIT

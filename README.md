# Backlog Therapy — Multi-Page Setup

## How It Works

Each game in `log.json` gets its own dedicated HTML page under the `/games/` directory with a clean URL based on the game title.

**Example:**
- `log.json` entry: `"title": "resident evil revelations"`
- Generated page: `games/resident-evil-revelations.html`
- Live URL: `https://ushindo0-0ay.github.io/backlog-therapy/games/resident-evil-revelations.html`

## Adding a New Game

### Option 1: Use the Logger (Recommended)
1. Open `ushindo-logger.html` in your browser
2. Rate your game and click **Save to Log** — this updates `log.json`
3. Run the page generator (step 4 below)

### Option 2: Edit `log.json` manually
Add a new entry to the `log.json` array following the existing structure.

### After adding a game — regenerate pages:
```bash
node generate-pages.js
```

This script will:
- Read `log.json`
- Delete all existing pages in `/games/`
- Generate fresh HTML pages for every game
- Output the live URLs to your terminal

### Commit & push
```bash
git add games/ index.html log.json
git commit -m "Add: <game title>"
git push
```

## File Structure

```
/
├── index.html                  # Homepage — lists all games, links to detail pages
├── log.json                    # Your game ratings data
├── generate-pages.js           # Node.js script — generates game pages from log.json
├── games/                      # Auto-generated — do NOT edit manually
│   ├── resident-evil-revelations.html
│   ├── gta.html
│   └── ... (one per game)
├── ushindo-logger.html         # Rating tool
├── icon-512.png
└── README.md
```

## Key Changes from Original

| Before | After |
|--------|-------|
| Clicking a card opened a modal overlay | Clicking a card navigates to `games/<slug>.html` |
| All content on one page | Each game has its own URL, shareable link |
| No related games | Each game page shows related games + full breakdown |

## Requirements

- **Node.js** — to run `generate-pages.js` (any version 14+)
- **GitHub Pages** — set to serve from `/ (root)` on your repo

## TMDB CLI

A small CLI to display movies from TMDB in your terminal.

### Setup

1. Get a TMDB v3 API key from https://www.themoviedb.org/settings/api
2. Export the key in your shell:

PowerShell:

```powershell
$env:TMDB_API_KEY="YOUR_KEY"
```

### Usage

Run via npm:

```powershell
npm run tmdb -- --type popular
```

Or install globally and run the binary:

```powershell
npm install -g .
tmdb-app --type top --limit 5
```

Supported types:
- playing (now playing)
- popular
- top (top rated)
- upcoming

Flags:
- `--page` Page number (default 1)
- `--limit` Results to show from the page (default 10)
- `--lang` Locale, e.g. `en-US`



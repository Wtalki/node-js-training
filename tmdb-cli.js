#!/usr/bin/env node

import { stdout, stderr, exit, env } from 'process';

function printUsage() {
  stdout.write(`TMDB CLI
Usage:
  tmdb-app --type playing|popular|top|upcoming [--page 1] [--limit 10] [--lang en-US]

Environment:
  TMDB_API_KEY  Your TMDB v3 API key (required)

Examples:
  tmdb-app --type popular
  tmdb-app --type top --limit 5
  tmdb-app --type playing --page 2 --lang en-US
`);
}

function parseArgs(argv) {
  const args = { type: '', page: 1, limit: 10, lang: 'en-US' };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--help' || key === '-h') return { help: true };
    if (key === '--type') { args.type = String(val || '').toLowerCase(); i += 1; continue; }
    if (key === '--page') { args.page = Number(val || '1'); i += 1; continue; }
    if (key === '--limit') { args.limit = Number(val || '10'); i += 1; continue; }
    if (key === '--lang') { args.lang = String(val || 'en-US'); i += 1; continue; }
    // Unknown flag: ignore
  }
  if (!['playing','popular','top','upcoming'].includes(args.type)) {
    return { error: "--type must be one of: playing, popular, top, upcoming" };
  }
  if (!Number.isInteger(args.page) || args.page < 1) args.page = 1;
  if (!Number.isInteger(args.limit) || args.limit < 1) args.limit = 10;
  return args;
}

function mapTypeToEndpoint(type) {
  if (type === 'playing') return 'now_playing';
  if (type === 'popular') return 'popular';
  if (type === 'top') return 'top_rated';
  if (type === 'upcoming') return 'upcoming';
  return 'popular';
}

function truncate(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.help) { printUsage(); return; }
  if (parsed.error) { stderr.write(parsed.error + '\n\n'); printUsage(); exit(1); }

  const apiKey = env.TMDB_API_KEY || '';
  if (!apiKey) {
    stderr.write('TMDB_API_KEY is not set. Please export your TMDB v3 API key.\n');
    exit(1);
    return;
  }

  const endpoint = mapTypeToEndpoint(parsed.type);
  const url = new URL(`https://api.themoviedb.org/3/movie/${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', parsed.lang);
  url.searchParams.set('page', String(parsed.page));

  try {
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      stderr.write(`TMDB request failed: ${resp.status} ${resp.statusText}\n${body}\n`);
      exit(1);
      return;
    }
    const json = await resp.json();
    const results = Array.isArray(json.results) ? json.results : [];
    const limited = results.slice(0, parsed.limit);
    if (limited.length === 0) {
      stdout.write('No results.\n');
      return;
    }

    stdout.write(`\nTMDB ${endpoint.replace('_',' ').toUpperCase()} — Page ${parsed.page}, showing ${limited.length} of ${results.length}\n`);
    stdout.write('='.repeat(80) + '\n');
    let index = 1;
    for (const movie of limited) {
      const title = movie.title || movie.name || 'Untitled';
      const date = movie.release_date || movie.first_air_date || 'N/A';
      const rating = movie.vote_average != null ? Number(movie.vote_average).toFixed(1) : 'N/A';
      const overview = truncate(String(movie.overview || ''), 180);
      stdout.write(`${String(index).padStart(2,' ')}. ${title} (${date})  ★ ${rating}\n`);
      if (overview) stdout.write(`    ${overview}\n`);
      stdout.write('\n');
      index += 1;
    }
  } catch (err) {
    stderr.write(`Network or parsing error: ${err?.message || err}\n`);
    exit(1);
  }
}

// Ensure fetch availability on older Node versions
if (typeof fetch === 'undefined') {
  const { default: nodeFetch } = await import('node-fetch');
  global.fetch = nodeFetch;
}

await main();



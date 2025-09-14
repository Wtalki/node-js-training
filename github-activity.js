#!/usr/bin/env node
import https from 'https';

function printUsage() {
  console.log('Usage:');
  console.log('  github-activity <username>');
  console.log('');
  console.log('Optional: set GITHUB_TOKEN to increase rate limits');
}

function fetchUserEvents(username) {
  const options = {
    hostname: 'api.github.com',
    path: `/users/${encodeURIComponent(username)}/events`,
    method: 'GET',
    headers: {
      'User-Agent': 'nodejs-cli',
      'Accept': 'application/vnd.github+json'
    }
  };

  if (process.env.GITHUB_TOKEN) {
    options.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });


      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          // try to parse error body if possible
          try {
            const body = JSON.parse(data || '{}');
            let message = body.message || `HTTP ${res.statusCode}`;
            const remaining = res.headers?.['x-ratelimit-remaining'];
            if (res.statusCode === 403 && remaining === '0') {
              message = 'API rate limit exceeded. Set GITHUB_TOKEN to increase limits.';
            }
            const error = new Error(message);
            error.statusCode = res.statusCode;
            return reject(error);
          } catch (_) {
            const error = new Error(`HTTP ${res.statusCode}`);
            error.statusCode = res.statusCode;
            return reject(error);
          }
        }

        try {
          const json = JSON.parse(data || '[]');
          resolve(json);
        } catch (err) {
          reject(new Error('Failed to parse GitHub response'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

function formatEvent(event) {
  const type = event?.type;
  const repo = event?.repo?.name || '(unknown repo)';

  switch (type) {
    case 'PushEvent': {
      const commits = event?.payload?.commits?.length ?? 0;
      return `Pushed ${commits} commit${commits === 1 ? '' : 's'} to ${repo}`;
    }
    case 'IssuesEvent': {
      const action = event?.payload?.action;
      return `${capitalize(action)} an issue in ${repo}`;
    }
    case 'IssueCommentEvent': {
      const action = event?.payload?.action;
      return `${capitalize(action)} a comment on an issue in ${repo}`;
    }
    case 'WatchEvent': {
      return `Starred ${repo}`;
    }
    case 'ForkEvent': {
      return `Forked ${repo}`;
    }
    case 'CreateEvent': {
      const refType = event?.payload?.ref_type;
      const ref = event?.payload?.ref;
      if (refType === 'repository') return `Created repository ${repo}`;
      return `Created ${refType} ${ref} in ${repo}`;
    }
    case 'DeleteEvent': {
      const refType = event?.payload?.ref_type;
      const ref = event?.payload?.ref;
      return `Deleted ${refType} ${ref} in ${repo}`;
    }
    case 'PullRequestEvent': {
      const action = event?.payload?.action;
      return `${capitalize(action)} a pull request in ${repo}`;
    }
    case 'PullRequestReviewEvent': {
      const action = event?.payload?.action;
      return `${capitalize(action)} a pull request review in ${repo}`;
    }
    case 'PullRequestReviewCommentEvent': {
      return `Commented on a pull request in ${repo}`;
    }
    case 'ReleaseEvent': {
      const action = event?.payload?.action;
      const tag = event?.payload?.release?.tag_name;
      return `${capitalize(action)} a release ${tag ? '(' + tag + ') ' : ''}in ${repo}`.trim();
    }
    default:
      return type ? `${type} on ${repo}` : `Activity on ${repo}`;
  }
}

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function main() {
  const args = process.argv.slice(2);
  const username = args[0];

  if (!username) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const events = await fetchUserEvents(username);
    if (!Array.isArray(events) || events.length === 0) {
      console.log(`No recent public activity found for ${username}.`);
      return;
    }
    for (const ev of events.slice(0, 30)) {
      console.log('- ' + formatEvent(ev));
    }
  } catch (err) {
    const message = err?.message || 'Failed to fetch activity';
    console.error('Error:', message);
    process.exitCode = typeof err?.statusCode === 'number' ? err.statusCode : 1;
  }
}

main();



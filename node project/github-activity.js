import https from 'https'

function printUsage(){
    console.log('Usage:')
    console.log(' githut-activity <username>')
    console.log('');
    console.log('Optional: set Github_token to increase rate limit')
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
              console.log(body)
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

  function formatEvent(event){
    const type = event.type;
    const repo = event?.repo?.name || '(unknown repo)';
    
    console.log(repo)
  }
  async function main(){
    const args = process.argv.slice(2)
    const username=args[0]
    if(!username){
        printUsage();
        process.exitCode = 1;
        return;
    }

    try {
        const events = await fetchUserEvents(username);
        if (!Array.isArray(events) || events.length === 0){
            console.log(`no recent public activity found for ${username}`)
            return;
        }

        for (const ev of events.slice(0,30)){
            console.log('- '+ formatEvent(ev))
        }
    }catch(err){
        const message = err?.message || 'Failed to fetch activity';
        console.error('Error:',message);
        process.exitCode = typeof err?.statusCode === 'number' ? err.statusCode : 1;
    }
  }

  main()
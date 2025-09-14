import { stdin, stdout, stderr, exit } from 'process';
import { createInterface } from 'readline';
import WebSocket from 'ws';

export function connectClient(url) {
  const ws = new WebSocket(url);
  const rl = createInterface({ input: stdin, output: stdout, prompt: '> ' });
  ws.on('open', () => { stdout.write(`Connected to ${url}\n`); rl.prompt(); });
  ws.on('message', (data) => {
    try {
      const obj = JSON.parse(data.toString());
      if (obj.type === 'system') stdout.write(`\n[system] ${obj.message}\n`);
      else if (obj.type === 'message') stdout.write(`\n${obj.from}: ${obj.text}\n`);
      else stdout.write(`\n${data}\n`);
    } catch { stdout.write(`\n${data}\n`); }
    rl.prompt();
  });
  ws.on('close', () => { stdout.write('\nDisconnected.\n'); rl.close(); exit(0); });
  ws.on('error', (err) => { stderr.write(`Error: ${err?.message || err}\n`); });
  rl.on('line', (line) => { const text = line.trim(); if (!text) return rl.prompt(); if (text === '/quit') return ws.close(); if (ws.readyState === WebSocket.OPEN) ws.send(text); rl.prompt(); });
  rl.on('SIGINT', () => { ws.close(); });
}

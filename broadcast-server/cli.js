import { argv, stdout } from 'process';
import { startBroadcastServer } from './server.js';
import { connectClient } from './client.js';

function printUsage() {
  stdout.write(`Broadcast Server CLI\n\n` +
    `Usage:\n` +
    `  broadcast-server start [--port 3020]\n` +
    `  broadcast-server connect [--url ws://localhost:3020]\n\n`);
}

function parseArgs() {
  const args = { cmd: '', port: 3020, url: 'ws://localhost:3020' };
  const list = argv.slice(2);
  args.cmd = list[0] || '';
  for (let i = 1; i < list.length; i += 1) {
    const k = list[i];
    const v = list[i + 1];
    if (k === '--help' || k === '-h') return { help: true };
    if (k === '--port') { args.port = Number(v || '3020'); i += 1; continue; }
    if (k === '--url') { args.url = String(v || ''); i += 1; continue; }
  }
  return args;
}

export function runCli() {
  const args = parseArgs();
  if (args.help || !args.cmd) return printUsage();
  if (args.cmd === 'start') return startBroadcastServer(args.port);
  if (args.cmd === 'connect') return connectClient(args.url);
  return printUsage();
}

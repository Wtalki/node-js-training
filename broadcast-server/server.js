import WebSocket, { WebSocketServer } from 'ws';

export function startBroadcastServer(port) {
  const wss = new WebSocketServer({ port });
  let nextId = 1;
  const clients = new Map();

  function broadcast(obj) {
    const data = JSON.stringify(obj);
    for (const ws of clients.keys()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  }

  wss.on('connection', (ws) => {
    const id = nextId++;
    clients.set(ws, { id });
    ws.send(JSON.stringify({ type: 'system', message: `Connected. You are #${id}` }));
    broadcast({ type: 'system', message: `#${id} joined` });
    ws.on('message', (data) => {
      const text = data.toString();
      broadcast({ type: 'message', from: `#${id}`, text, ts: new Date().toISOString() });
    });
    ws.on('close', () => { clients.delete(ws); broadcast({ type: 'system', message: `#${id} left` }); });
    ws.on('error', () => {});
  });

  wss.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log(`Broadcast server listening on ws://localhost:${port}`);
  });

  const shutdown = () => {
    // eslint-disable-next-line no-console
    console.log('\nShutting down...');
    for (const ws of clients.keys()) { try { ws.close(1001, 'Server shutting down'); } catch {} }
    wss.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

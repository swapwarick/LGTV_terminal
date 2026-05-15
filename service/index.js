'use strict';

const Service   = require('webos-service');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const PORT = 9001;

// Register with the Luna bus — keeps the process alive under the webOS service manager
const service = new Service('com.swapnil.lgterminal.service');

// WebSocket server bound to loopback only (not reachable from outside the TV)
const wss = new WebSocket.Server({ host: '127.0.0.1', port: PORT });

wss.on('listening', () => {
  console.log(`[terminal-service] WebSocket listening on ws://127.0.0.1:${PORT}`);
});

wss.on('connection', (ws) => {
  console.log('[terminal-service] Client connected');

  const shell = spawn('/bin/sh', ['-i'], {
    env: {
      PATH:    '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      HOME:    '/home/root',
      USER:    'root',
      LOGNAME: 'root',
      TERM:    'xterm-256color',
      PS1:     '[webOS]\\$ ',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false,
  });

  const send = (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk.toString('utf8'));
    }
  };

  shell.stdout.on('data', send);
  shell.stderr.on('data', send);

  shell.on('error', (err) => {
    send(`\r\n\x1b[31m[service error: ${err.message}]\x1b[0m\r\n`);
    ws.close();
  });

  shell.on('exit', (code, signal) => {
    send(`\r\n\x1b[33m[shell exited — code=${code} signal=${signal}]\x1b[0m\r\n`);
    if (ws.readyState === WebSocket.OPEN) ws.close();
  });

  ws.on('message', (msg) => {
    try { shell.stdin.write(msg); } catch (_) {}
  });

  ws.on('close', () => {
    try { shell.kill('SIGTERM'); } catch (_) {}
    console.log('[terminal-service] Client disconnected');
  });

  ws.on('error', () => ws.terminate());
});

wss.on('error', (err) => {
  console.error('[terminal-service] WSS error:', err.message);
});

// Luna methods — the app (or Developer Mode tooling) can call these
service.register('status', (message) => {
  message.respond({
    returnValue: true,
    running: true,
    port: PORT,
    clients: wss.clients.size,
  });
});

service.register('stop', (message) => {
  message.respond({ returnValue: true });
  wss.close(() => process.exit(0));
});

/**
 * relay.js — WebSocket-to-PTY relay server
 * Run this on your Mac or Linux, then connect from the LG TV app.
 *
 * Usage:
 *   node relay.js                   # listens on port 7681, all interfaces
 *   PORT=9000 node relay.js         # custom port
 *   SHELL=/usr/bin/zsh node relay.js  # custom shell
 */

'use strict';

const WebSocket = require('ws');
const pty       = require('node-pty');
const os        = require('os');

const PORT      = parseInt(process.env.PORT  || '7681', 10);
const SHELL     = process.env.SHELL || (os.platform() === 'darwin' ? '/bin/zsh' : '/bin/bash');
const HOST      = process.env.HOST  || '0.0.0.0';

const wss = new WebSocket.Server({host: HOST, port: PORT});

wss.on('listening', () => {
	const ifaces = Object.values(os.networkInterfaces())
		.flat()
		.filter(i => i.family === 'IPv4' && !i.internal)
		.map(i => `  ws://${i.address}:${PORT}`);

	console.log('\n  LG Terminal Relay Server\n');
	console.log(`  Shell : ${SHELL}`);
	console.log(`  Port  : ${PORT}`);
	console.log('\n  Local addresses (enter one of these in the TV app):\n');
	ifaces.forEach(a => console.log(a));
	if (!ifaces.length) console.log(`  ws://127.0.0.1:${PORT}  (loopback only)`);
	console.log('\n  Waiting for TV connection…\n');
});

wss.on('connection', (ws, req) => {
	const clientIp = req.socket.remoteAddress;
	console.log(`[+] TV connected from ${clientIp}`);

	// Spawn a real PTY — supports vim, top, nano, etc.
	const shell = pty.spawn(SHELL, [], {
		name: 'xterm-256color',
		cols:  220,
		rows:  50,
		cwd:   process.env.HOME || os.homedir(),
		env:   process.env,
	});

	// PTY output → TV
	shell.onData((data) => {
		if (ws.readyState === WebSocket.OPEN) ws.send(data);
	});

	// TV keystrokes → PTY
	ws.on('message', (msg) => {
		try { shell.write(msg.toString()); } catch (_) {}
	});

	// TV resize event (JSON: { type:"resize", cols, rows })
	// The TV app sends this when xterm.js resizes
	ws.on('message', (msg) => {
		try {
			const data = JSON.parse(msg);
			if (data.type === 'resize') {
				shell.resize(data.cols, data.rows);
			}
		} catch (_) {
			// Not JSON — treat as raw terminal input (handled above)
		}
	});

	shell.onExit(({exitCode}) => {
		console.log(`[-] Shell exited (code ${exitCode})`);
		if (ws.readyState === WebSocket.OPEN) ws.close();
	});

	ws.on('close', () => {
		console.log(`[-] TV disconnected (${clientIp})`);
		try { shell.kill(); } catch (_) {}
	});

	ws.on('error', () => ws.terminate());
});

wss.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(`\n  ERROR: Port ${PORT} is already in use.\n  Try: PORT=9000 node relay.js\n`);
	} else {
		console.error('WSS error:', err.message);
	}
	process.exit(1);
});

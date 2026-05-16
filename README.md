# LG Terminal

A proper **LG Content Store** terminal app built with Enact (LG's official React TV framework) + xterm.js.

Connects your LG TV to a real bash/zsh session running on your Mac or Linux over a local WebSocket relay.

```
LG TV  ──WebSocket──▶  relay.js on Mac/Linux  ──PTY──▶  bash / zsh
```

---

## What you get

| Screen | Description |
|---|---|
| **Home** | Grid of saved server connections; add / edit / delete |
| **Add Server** | Name, IP address, port — saved in localStorage |
| **Terminal** | Full-screen xterm.js, 256-colour, real PTY (vim, top, nano all work) |

Remote navigation, 5-way Magic Remote focus management, and auto-reconnect are all handled by Enact.

---

## Quick start

### 1 — Relay server (Mac / Linux)

```bash
cd relay
npm install
node relay.js
```

It will print your local IP addresses. Leave it running.

### 2 — TV app (Windows build machine)

```powershell
# Prerequisites (once):
npm install -g @webos-tools/cli     # webOS CLI
# Enable Developer Mode on the TV (see below)
# Register the TV:
ares-setup-device                   # name: tv, port: 9922

# Build + deploy:
.\build.ps1 -Deploy
```

---

## Enable Developer Mode on your LG TV

1. **Settings → Support → About This TV**
2. Click the **LG logo** 5 times rapidly
3. Sign in with a free LG Developer account at [webostv.developer.lge.com](https://webostv.developer.lge.com)
4. Toggle Developer Mode **ON** and restart the TV
5. After reboot, note the **TV IP address** shown on the same screen

---

## Manual commands

```powershell
# Build only
.\build.ps1

# Install a pre-built .ipk
ares-install --device tv .\com.swapnil.terminal_1.0.0_all.ipk

# Launch
ares-launch --device tv com.swapnil.terminal

# Stream app logs
ares-inspect --device tv --app com.swapnil.terminal

# Stream service logs (if applicable)
ares-inspect --device tv --service com.swapnil.terminal.service
```

---

## LG Content Store submission checklist

- [ ] Change `"vendor"` in `webos-meta/appinfo.json` to your registered company name
- [ ] Change `"id"` to a domain you own (e.g. `com.yourname.terminal`)
- [ ] Add a Privacy Policy URL (required by LG)
- [ ] Test on a real webOS 5+ TV
- [ ] Submit at [seller.lgappstv.com](https://seller.lgappstv.com)

---

## Project structure

```
LG_Terminal/
├── src/
│   ├── index.js                    App entry
│   ├── App.js                      Root + navigation state
│   ├── storage.js                  localStorage helpers
│   ├── views/
│   │   ├── HomeView.js / .less     Server list
│   │   ├── AddServerView.js / .less  Add / edit form
│   │   └── TerminalView.js / .less   Full-screen terminal
│   └── components/
│       └── TerminalEmulator.js     xterm.js React wrapper
├── relay/
│   ├── relay.js                    WebSocket-to-PTY bridge (run on Mac/Linux)
│   └── package.json                ws + node-pty
├── webos-meta/
│   └── appinfo.json                webOS app metadata
├── .enact                          Enact build config
├── package.json                    Enact + React 17 + xterm.js
├── build.ps1                       Build + deploy (Windows)
└── README.md
```

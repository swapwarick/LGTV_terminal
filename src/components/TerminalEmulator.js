import {useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const THEME = {
	background:          '#000000',
	foreground:          '#d0ffd0',
	cursor:              '#00ff44',
	cursorAccent:        '#000000',
	selectionBackground: 'rgba(0,255,68,0.2)',
	black:               '#000000',
	red:                 '#ff4444',
	green:               '#00dd44',
	yellow:              '#ffdd00',
	blue:                '#4488ff',
	magenta:             '#ff44ff',
	cyan:                '#00ffcc',
	white:               '#cccccc',
	brightBlack:         '#555555',
	brightRed:           '#ff6666',
	brightGreen:         '#66ff88',
	brightYellow:        '#ffee55',
	brightBlue:          '#66aaff',
	brightMagenta:       '#ff66ff',
	brightCyan:          '#66ffdd',
	brightWhite:         '#ffffff',
};

// Exposes write() and fit() to the parent via ref
const TerminalEmulator = forwardRef(({onData, style}, ref) => {
	const containerRef = useRef(null);
	const termRef      = useRef(null);
	const fitRef       = useRef(null);

	useImperativeHandle(ref, () => ({
		write: (data) => termRef.current?.write(data),
		fit:   ()     => fitRef.current?.fit(),
		focus: ()     => termRef.current?.focus(),
	}));

	useEffect(() => {
		const term = new Terminal({
			fontSize:          20,
			fontFamily:        '"Cascadia Code", "Source Code Pro", "Courier New", monospace',
			cursorBlink:       true,
			cursorStyle:       'block',
			scrollback:        5000,
			allowProposedApi:  true,
			theme:             THEME,
		});

		const fitAddon = new FitAddon();
		term.loadAddon(fitAddon);
		term.open(containerRef.current);
		fitAddon.fit();
		term.focus();

		termRef.current = term;
		fitRef.current  = fitAddon;

		const onResize = () => fitAddon.fit();
		window.addEventListener('resize', onResize);

		// Forward key input to the parent
		const disposeData = term.onData(onData);

		return () => {
			disposeData.dispose();
			window.removeEventListener('resize', onResize);
			term.dispose();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div
			ref={containerRef}
			style={{width: '100%', height: '100%', overflow: 'hidden', ...style}}
		/>
	);
});

TerminalEmulator.displayName = 'TerminalEmulator';

export default TerminalEmulator;

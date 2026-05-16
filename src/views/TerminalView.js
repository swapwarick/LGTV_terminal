import {useEffect, useRef, useState, useCallback} from 'react';
import TerminalEmulator from '../components/TerminalEmulator';
import css from './TerminalView.module.less';

const MAX_RETRIES = 8;
const RETRY_DELAY = 2500;

const STATUS = {
	connecting:   {dot: css.dotYellow, text: 'Connecting…'},
	connected:    {dot: css.dotGreen,  text: 'Connected'},
	reconnecting: {dot: css.dotYellow, text: 'Reconnecting…'},
	disconnected: {dot: css.dotRed,    text: 'Disconnected'},
	failed:       {dot: css.dotRed,    text: 'Connection failed'},
};

const TerminalView = ({server, onBack}) => {
	const termRef    = useRef(null);
	const wsRef      = useRef(null);
	const retryRef   = useRef(0);
	const timerRef   = useRef(null);
	const [status, setStatus] = useState('connecting');

	const writeToTerm = useCallback((text) => termRef.current?.write(text), []);

	const connect = useCallback(() => {
		const url = `ws://${server.host}:${server.port || 7681}`;
		setStatus('connecting');

		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			retryRef.current = 0;
			setStatus('connected');
			writeToTerm(`\r\n\x1b[32m● Connected to ${server.name} (${url})\x1b[0m\r\n\r\n`);
			termRef.current?.focus();
		};

		ws.onmessage = (e) => writeToTerm(e.data);

		ws.onclose = () => {
			if (retryRef.current >= MAX_RETRIES) {
				setStatus('failed');
				writeToTerm(`\r\n\x1b[31m● Connection lost. Max retries reached.\x1b[0m\r\n`);
			} else {
				retryRef.current++;
				setStatus('reconnecting');
				writeToTerm(`\r\n\x1b[33m● Reconnecting (${retryRef.current}/${MAX_RETRIES})…\x1b[0m\r\n`);
				timerRef.current = setTimeout(connect, RETRY_DELAY);
			}
		};

		ws.onerror = () => ws.close();
	}, [server, writeToTerm]);

	// Mount: connect; unmount: cleanup
	useEffect(() => {
		connect();
		return () => {
			clearTimeout(timerRef.current);
			wsRef.current?.close();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Relay terminal keystrokes → WebSocket
	const handleData = useCallback((data) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(data);
		}
	}, []);

	const {dot, text} = STATUS[status] || STATUS.connecting;

	return (
		<div className={css.root}>
			{/* Status bar */}
			<div className={css.bar}>
				<span className={`${css.dot} ${dot}`} />
				<span className={css.serverName}>{server.name}</span>
				<span className={css.barSep}>·</span>
				<span className={css.statusText}>{text}</span>
				<span className={css.barRight}>
					{server.host}:{server.port || 7681}
					&nbsp;&nbsp;
					<span className={css.backHint}>← BACK to disconnect</span>
				</span>
			</div>

			{/* Terminal */}
			<div className={css.termWrap}>
				<TerminalEmulator ref={termRef} onData={handleData} />
			</div>
		</div>
	);
};

export default TerminalView;

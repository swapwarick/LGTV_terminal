import {useState, useEffect, useCallback} from 'react';
import MoonstoneDecorator from '@enact/moonstone/MoonstoneDecorator';
import HomeView from './views/HomeView';
import AddServerView from './views/AddServerView';
import TerminalView from './views/TerminalView';

const App = () => {
	const [screen, setScreen] = useState('home');
	const [activeServer, setActiveServer] = useState(null);
	const [editServer, setEditServer] = useState(null);

	const goHome = useCallback(() => setScreen('home'), []);

	const handleConnect = useCallback((server) => {
		setActiveServer(server);
		setScreen('terminal');
	}, []);

	const handleAdd = useCallback(() => {
		setEditServer(null);
		setScreen('add');
	}, []);

	const handleEdit = useCallback((server) => {
		setEditServer(server);
		setScreen('add');
	}, []);

	// webOS back key: keyCode 461 (Magic Remote back button)
	useEffect(() => {
		const onKey = (e) => {
			if ((e.keyCode === 461 || e.key === 'XF86Back') && screen !== 'home') {
				goHome();
			}
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [screen, goHome]);

	return (
		<>
			{screen === 'home' && (
				<HomeView
					onConnect={handleConnect}
					onAdd={handleAdd}
					onEdit={handleEdit}
				/>
			)}
			{screen === 'add' && (
				<AddServerView
					server={editServer}
					onSave={goHome}
					onBack={goHome}
				/>
			)}
			{screen === 'terminal' && activeServer && (
				<TerminalView server={activeServer} onBack={goHome} />
			)}
		</>
	);
};

export default MoonstoneDecorator({ri: {unit: 'rem'}}, App);

import {useState, useCallback} from 'react';
import Button from '@enact/moonstone/Button';
import Heading from '@enact/moonstone/Heading';
import Input from '@enact/moonstone/Input';
import BodyText from '@enact/moonstone/BodyText';
import {loadServers, saveServers, newId} from '../storage';
import css from './AddServerView.module.less';

const DEFAULT_PORT = '7681';

const AddServerView = ({server, onSave, onBack}) => {
	const isEdit = Boolean(server);
	const [name, setName] = useState(server?.name || '');
	const [host, setHost] = useState(server?.host || '');
	const [port, setPort] = useState(server?.port || DEFAULT_PORT);
	const [error, setError] = useState('');

	const validate = useCallback(() => {
		if (!name.trim()) return 'Name is required.';
		if (!host.trim()) return 'Host / IP address is required.';
		const p = parseInt(port, 10);
		if (isNaN(p) || p < 1 || p > 65535) return 'Port must be 1–65535.';
		return '';
	}, [name, host, port]);

	const handleSave = useCallback(() => {
		const err = validate();
		if (err) { setError(err); return; }

		const list = loadServers();
		if (isEdit) {
			const idx = list.findIndex(s => s.id === server.id);
			if (idx !== -1) list[idx] = {...list[idx], name: name.trim(), host: host.trim(), port: port.trim()};
		} else {
			list.push({id: newId(), name: name.trim(), host: host.trim(), port: port.trim()});
		}
		saveServers(list);
		onSave();
	}, [validate, isEdit, server, name, host, port, onSave]);

	return (
		<div className={css.root}>
			<div className={css.card}>
				{/* Header */}
				<div className={css.header}>
					<span className={css.logo}>&gt;_</span>
					<Heading size="title" className={css.title}>
						{isEdit ? 'Edit Server' : 'Add Server'}
					</Heading>
				</div>

				<BodyText className={css.hint}>
					Run <code>node relay.js</code> on your Mac or Linux, then enter its local IP address below.
				</BodyText>

				{/* Form */}
				<div className={css.field}>
					<label className={css.label}>Display Name</label>
					<Input
						placeholder="e.g. My MacBook"
						value={name}
						onChange={({value}) => setName(value)}
						className={css.input}
					/>
				</div>

				<div className={css.field}>
					<label className={css.label}>Host / IP Address</label>
					<Input
						placeholder="e.g. 192.168.1.42"
						value={host}
						onChange={({value}) => setHost(value)}
						className={css.input}
					/>
				</div>

				<div className={css.field}>
					<label className={css.label}>Port</label>
					<Input
						placeholder="7681"
						value={port}
						onChange={({value}) => setPort(value)}
						className={css.input}
						type="number"
					/>
				</div>

				{error && <BodyText className={css.error}>{error}</BodyText>}

				{/* Actions */}
				<div className={css.actions}>
					<Button backgroundOpacity="translucent" onClick={onBack}>Cancel</Button>
					<Button onClick={handleSave}>
						{isEdit ? 'Save Changes' : 'Add Server'}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default AddServerView;

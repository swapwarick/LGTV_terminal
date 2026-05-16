import {useState, useCallback} from 'react';
import Button from '@enact/moonstone/Button';
import Heading from '@enact/moonstone/Heading';
import Item from '@enact/moonstone/Item';
import Scroller from '@enact/moonstone/Scroller';
import BodyText from '@enact/moonstone/BodyText';
import {loadServers, saveServers} from '../storage';
import css from './HomeView.module.less';

const HomeView = ({onConnect, onAdd, onEdit}) => {
	const [servers, setServers] = useState(loadServers);

	const handleDelete = useCallback((e, id) => {
		e.stopPropagation();
		const updated = loadServers().filter(s => s.id !== id);
		saveServers(updated);
		setServers(updated);
	}, []);

	const handleEdit = useCallback((e, server) => {
		e.stopPropagation();
		onEdit(server);
	}, [onEdit]);

	return (
		<div className={css.root}>
			{/* ── Header ── */}
			<div className={css.header}>
				<div className={css.headerLeft}>
					<span className={css.logo}>&gt;_</span>
					<div>
						<Heading size="title" className={css.title}>Terminal</Heading>
						<BodyText className={css.subtitle}>Connect to your Mac or Linux machine</BodyText>
					</div>
				</div>
				<Button
					backgroundOpacity="translucent"
					icon="plus"
					onClick={onAdd}
					className={css.addBtn}
				>
					Add Server
				</Button>
			</div>

			{/* ── Server List ── */}
			<Scroller className={css.scroller}>
				{servers.length === 0 ? (
					<div className={css.empty}>
						<div className={css.emptyIcon}>&gt;_</div>
						<BodyText centered>No servers added yet.</BodyText>
						<BodyText centered>Press <strong>Add Server</strong> and enter your Mac or Linux IP address.</BodyText>
					</div>
				) : (
					<div className={css.grid}>
						{servers.map(server => (
							<div key={server.id} className={css.card}>
								<Item
									className={css.cardItem}
									label={`${server.host}:${server.port || 7681}`}
									onClick={() => onConnect(server)}
								>
									{server.name}
								</Item>
								<div className={css.cardActions}>
									<Button
										size="small"
										backgroundOpacity="transparent"
										icon="edit"
										onClick={(e) => handleEdit(e, server)}
									/>
									<Button
										size="small"
										backgroundOpacity="transparent"
										icon="trash"
										onClick={(e) => handleDelete(e, server.id)}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</Scroller>

			{/* ── Footer ── */}
			<div className={css.footer}>
				<BodyText className={css.footerText}>
					Run the relay on your PC, Mac, or Linux:&nbsp;
					<code>node relay.js</code>
				</BodyText>
			</div>
		</div>
	);
};

export default HomeView;

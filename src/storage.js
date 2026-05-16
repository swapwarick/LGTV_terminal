const KEY = 'lgt_servers';

export const loadServers = () => {
	try {
		return JSON.parse(localStorage.getItem(KEY) || '[]');
	} catch {
		return [];
	}
};

export const saveServers = (list) => {
	localStorage.setItem(KEY, JSON.stringify(list));
};

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

import ReactDOM from 'react-dom';
import App from './App';

const appElement = (
	<App />
);

// In a browser environment render the app to the document
if (typeof window !== 'undefined') {
	ReactDOM.render(appElement, document.getElementById('root'));
}

export default appElement;

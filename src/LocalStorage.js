export const loadState = () => {
	try {
		const serialState = localStorage.getItem("appState");
		if (serialState === null) return {};

		return JSON.parse(serialState);
	} catch (err) {
		return {};
	}
};

export const saveState = (data = {}) => {
	try {
		const serialState = JSON.stringify(data);
		localStorage.setItem("appState", serialState);
		return true;
	} catch (err) {
		console.log(err);
		return false;
	}
};

export const initializeState = () => {
	let state = loadState();
	if (!state.defaultBackendAddress) {
		let settings = {

			nameMappings: { //This must be removed, should be some mapping maintained in the node and retrieved only for the keys that need to be displayed
				"weave27sV7KygEfM25npXZR4irxZE5QFNMiD5rUL9jFo6eGKuK": "Borrower", //UI
				"weave27n688cevWMfXv3h9Kn6hC3FJtRXE76Ph5LNGNvBAAXic": "Borrower", //backend
				"weaveqt8AwgmyhPvitaNkzFGNedAeqKsE2SNFV86ARLBi6Vjk": "Lender", //UI
				"weave23zYUcTg3CKrUeXi4SzYKNJ385J4kmPZViHy6E668euym": "Lender", //backend
				"weaveia99JozxtPRkP4ktjTnc8NPuPrzsggabHnU5S5QDwfkc": "Node",
				"weavezwJVdk97G7hV9S9J1ScbkaPdL1rYbLVJtff86aFBuo3B": "Node"
			}
		};

		if (window.location.host.startsWith("localhost")) {
			settings = {
				...settings,

				depositorPub: 'weave23WjujYcoZwMrFypTzmZchqH7P5podUT9uG125xxGQG8g', //TODO: remove, used for checking the role now, must be dropped
				defaultBackendAddress: 'http://localhost:18002/2a2a5c5ea9849bac035ee0aba5b967b9',
				grantTarget: 'localhost:18001/2a2a5c5ea9849bac035ee0aba5b967b9', //TODO: needs to be prefixed with http:// or https:// and set the useHttps flag server side appropriately
				grantPub: 'target node public key',

			}
		} else {
			settings = {
				...settings,

				depositorPub: 'weaveqt8AwgmyhPvitaNkzFGNedAeqKsE2SNFV86ARLBi6Vjk', //TODO: remove, used for checking the role now, must be dropped. UI
				defaultBackendAddress: 'https://demo-borrower.accountable.capital:443/2a2a5c5ea9849bac035ee0aba5b967b9',
				grantTarget: 'demo-lender.accountable.capital:443/2a2a5c5ea9849bac035ee0aba5b967b9', //TODO: needs to be prefixed with http:// or https:// and set the useHttps flag server side appropriately
				grantPub: 'weave23zYUcTg3CKrUeXi4SzYKNJ385J4kmPZViHy6E668euym', //backend

				nameMappings: { //This should be some mapping maintained in the node
					"weave27sV7KygEfM25npXZR4irxZE5QFNMiD5rUL9jFo6eGKuK": "Borrower", //UI
					"weave27n688cevWMfXv3h9Kn6hC3FJtRXE76Ph5LNGNvBAAXic": "Borrower", //backend
					"weaveqt8AwgmyhPvitaNkzFGNedAeqKsE2SNFV86ARLBi6Vjk": "Lender", //UI
					"weave23zYUcTg3CKrUeXi4SzYKNJ385J4kmPZViHy6E668euym": "Lender", //backend
					"weaveia99JozxtPRkP4ktjTnc8NPuPrzsggabHnU5S5QDwfkc": "Node",
					"weavezwJVdk97G7hV9S9J1ScbkaPdL1rYbLVJtff86aFBuo3B": "Node"
				}
			}
		}

		state = {
			...state,
			...settings

		}
		saveState(state)
	}
}

initializeState();

const LOCAL_STORAGE = {
	saveState,
	loadState,
	initializeState
};

export default LOCAL_STORAGE;


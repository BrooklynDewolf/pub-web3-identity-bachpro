const ETHERSCAN_API_KEY = '';
const OPENSEA_API_KEY = '';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2/' + 'chain/ethereum/account';

const elementsPerPage = 10;

async function fetchData(url, options = {}) {
	try {
		const response = await fetch(url, options);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Error fetching data from ${url}:`, error);
		throw error;
	}
}

async function getTransactions(userWalletAddress, page = 1, sort = 'desc', limit = elementsPerPage) {
	const offset = (page - 1) * elementsPerPage;
	const url = `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${userWalletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${limit}&sort=${sort}&apikey=${ETHERSCAN_API_KEY}`;
	return fetchData(url);
}

async function getERC20Transactions(userWalletAddress, page = 1, sort = 'desc', limit = elementsPerPage) {
	const offset = (page - 1) * elementsPerPage;
	const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${userWalletAddress}&page=${page}&offset=${limit}&startblock=0&endblock=99999999&sort=${sort}&apikey=${ETHERSCAN_API_KEY}`;
	return fetchData(url);
}

async function getAccountBalance(userWalletAddress) {
	const url = `${ETHERSCAN_BASE_URL}?module=account&action=balance&address=${userWalletAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
	return fetchData(url);
}

async function getNFTs(userWalletAddress, limit = elementsPerPage) {
	const url = `${OPENSEA_BASE_URL}/${userWalletAddress}/nfts?limit=${limit}`;
	const options = {
		headers: {
			'X-API-KEY': OPENSEA_API_KEY,
		},
	};
	return fetchData(url, options);
}

export { getTransactions, getERC20Transactions, getAccountBalance, getNFTs };

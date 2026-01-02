const {IpNotFoundError} = require('./core.js');
const {validateIp, createAbortSignal, withAbortSignal} = require('./utils-browser.js');

const queryHttps = async (version, urls, options = {}, abortSignal) => {
	const urlList = [
		...urls,
		...(options.fallbackUrls ?? []),
	];

	const requests = urlList.map(async url => {
		const response = await fetch(url, {signal: abortSignal});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const responseText = await response.text();
		const ip = responseText.trim();

		if (validateIp(ip, version)) {
			return ip;
		}

		throw new Error('Invalid IP');
	});

	try {
		return await Promise.any(requests);
	} catch (error) {
		const errors = error.errors ?? [];
		const lastError = errors.at?.(-1) ?? error;
		throw new IpNotFoundError({cause: lastError});
	}
};

const createQuery = (version, queryFunction, options) => {
	const abortSignal = createAbortSignal(options.timeout, options.signal);
	return withAbortSignal(queryFunction(abortSignal), abortSignal);
};

module.exports = {
	queryHttps,
	createQuery,
};

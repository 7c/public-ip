const {isIPv4, isIPv6} = require('node:net');

const validateIp = (ip, version) => Boolean(ip && (version === 'v6' ? isIPv6(ip) : isIPv4(ip)));

const createAbortSignal = (timeout, signal) => {
	if (signal) {
		signal.throwIfAborted();
	}

	if (!timeout && !signal) {
		return undefined;
	}

	const signals = [];
	if (timeout) {
		signals.push(AbortSignal.timeout(timeout));
	}

	if (signal) {
		signals.push(signal);
	}

	return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
};

const withAbortSignal = async (promise, abortSignal) => {
	if (!abortSignal) {
		return promise;
	}

	abortSignal.throwIfAborted();

	const abortPromise = new Promise((_resolve, reject) => {
		abortSignal.addEventListener('abort', () => reject(abortSignal.reason), {once: true});
	});

	return Promise.race([promise, abortPromise]);
};

module.exports = {
	validateIp,
	createAbortSignal,
	withAbortSignal,
};

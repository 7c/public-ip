import type {IpVersion} from './types';

export const validateIp = (ip: string, version: IpVersion): boolean => {
	if (!ip || typeof ip !== 'string') {
		return false;
	}

	if (version === 'v6') {
		// Simple IPv6 validation - check for colons and hex characters
		return /^[\da-f:]+$/i.test(ip) && ip.includes(':');
	}

	// Simple IPv4 validation - check for dots and numbers
	const parts = ip.split('.');
	return parts.length === 4 && parts.every(part => {
		const number = Number(part);
		return !Number.isNaN(number) && number >= 0 && number <= 255;
	});
};

export const createAbortSignal = (timeout?: number, signal?: AbortSignal): AbortSignal | undefined => {
	if (signal) {
		signal.throwIfAborted();
	}

	if (!timeout && !signal) {
		return undefined;
	}

	const signals: AbortSignal[] = [];
	if (timeout) {
		signals.push(AbortSignal.timeout(timeout));
	}

	if (signal) {
		signals.push(signal);
	}

	return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
};

export const withAbortSignal = async <T>(promise: Promise<T>, abortSignal?: AbortSignal): Promise<T> => {
	if (!abortSignal) {
		return promise;
	}

	abortSignal.throwIfAborted();

	const abortPromise = new Promise<never>((_resolve, reject) => {
		abortSignal.addEventListener('abort', () => {
			reject(abortSignal.reason);
		}, {once: true});
	});

	return Promise.race([promise, abortPromise]);
};

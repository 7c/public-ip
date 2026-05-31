import {isIPv4, isIPv6} from 'node:net';
import type {IpVersion} from './types';

export const validateIp = (ip: string, version: IpVersion): boolean =>
	Boolean(ip && (version === 'v6' ? isIPv6(ip) : isIPv4(ip)));

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

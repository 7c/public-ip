import {IpNotFoundError} from './core';
import {validateIp, createAbortSignal, withAbortSignal} from './utils-browser';
import type {IpVersion, Options} from './types';

const lastAggregateError = (error: unknown): unknown =>
	(error instanceof AggregateError && error.errors.length > 0 ? error.errors.at(-1) : error);

export const queryHttps = async (
	version: IpVersion,
	urls: readonly string[],
	options: Options = {},
	abortSignal?: AbortSignal,
): Promise<string> => {
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
		throw new IpNotFoundError({cause: lastAggregateError(error)});
	}
};

export const createQuery = (
	_version: IpVersion,
	queryFunction: (abortSignal?: AbortSignal) => Promise<string>,
	options: Options,
): Promise<string> => {
	const abortSignal = createAbortSignal(options.timeout, options.signal);
	return withAbortSignal(queryFunction(abortSignal), abortSignal);
};

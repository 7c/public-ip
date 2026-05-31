import {createQuery} from './query-browser';
import {defaults} from './constants';
import type {IpVersion, IpFunction, QueryFunction} from './types';

export const createIpFunction = (version: IpVersion, queryFunction: QueryFunction): IpFunction =>
	(options = {}) => {
		const mergedOptions = {
			...defaults,
			...options,
		};

		return createQuery(
			version,
			abortSignal => queryFunction(version, mergedOptions, abortSignal),
			mergedOptions,
		);
	};

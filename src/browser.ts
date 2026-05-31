import {createPublicIp, IpNotFoundError} from './core';
import {queryHttps} from './query-browser';
import {browserUrls} from './constants';
import {createIpFunction} from './shared-browser';
import type {IpVersion, Options, IpFunction} from './types';

const browserQueryFunction = (version: IpVersion, options: Options, abortSignal?: AbortSignal): Promise<string> =>
	queryHttps(version, browserUrls[version], options, abortSignal);

/**
Get your public IPv4 address via HTTPS (browser).
*/
export const publicIpv4: IpFunction = createIpFunction('v4', browserQueryFunction);

/**
Get your public IPv6 address via HTTPS (browser).
*/
export const publicIpv6: IpFunction = createIpFunction('v6', browserQueryFunction);

/**
Get your public IP address via HTTPS (browser). Tries IPv6 first, then falls back to IPv4.
*/
export const publicIp: IpFunction = createPublicIp(publicIpv4, publicIpv6);

export {IpNotFoundError};
export type {Options, IpVersion} from './types';

const publicIpModule = {
	publicIp,
	publicIpv4,
	publicIpv6,
	IpNotFoundError,
};

export default publicIpModule;

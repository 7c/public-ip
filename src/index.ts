import {promisify} from 'node:util';
import dgram from 'node:dgram';
import dns from 'dns-socket';
import {createPublicIp, IpNotFoundError} from './core';
import {validateIp} from './utils';
import {queryHttps} from './query';
import {dnsServers, httpsUrls, type DnsQuestionConfig} from './constants';
import {createIpFunction} from './shared';
import type {IpVersion, Options, IpFunction} from './types';

const DNS_PORT = 53;
const DNS_TIMEOUT = 30_000;

type DnsQuestion = Omit<DnsQuestionConfig, 'servers'>;

type DnsQuery = {questions: Array<{name: string; type: string}>};
type DnsResponse = {answers: Array<{data: string | Buffer}>};

const createDnsQuery = (server: string, version: IpVersion, {name, type, transform}: DnsQuestion): Promise<string> => {
	const socket = dns({
		retries: 0,
		maxQueries: 1,
		socket: dgram.createSocket(version === 'v6' ? 'udp6' : 'udp4'),
		timeout: DNS_TIMEOUT,
	});

	const socketQuery = promisify(socket.query.bind(socket)) as (
		query: DnsQuery,
		port: number,
		server: string,
	) => Promise<DnsResponse>;

	return (async () => {
		try {
			const dnsResponse = await socketQuery({questions: [{name, type}]}, DNS_PORT, server);
			const answer = dnsResponse.answers[0];

			if (!answer) {
				throw new Error('Empty DNS response');
			}

			const {data} = answer;
			const response = (typeof data === 'string' ? data : data.toString()).trim();
			const ip = transform?.(response) ?? response;

			if (validateIp(ip, version)) {
				return ip;
			}

			throw new Error('Invalid IP');
		} finally {
			socket.destroy();
		}
	})();
};

const queryDns = async (version: IpVersion): Promise<string> => {
	const queries = dnsServers.flatMap(serverConfig => {
		const {servers, ...question} = serverConfig[version];
		return servers.map(server => createDnsQuery(server, version, question));
	});

	try {
		return await Promise.any(queries);
	} catch (error) {
		const lastError = error instanceof AggregateError && error.errors.length > 0
			? error.errors.at(-1)
			: error;
		throw new IpNotFoundError({cause: lastError});
	}
};

const queryAll = async (version: IpVersion, options: Options, abortSignal?: AbortSignal): Promise<string> => {
	try {
		return await queryDns(version);
	} catch {
		return queryHttps(version, httpsUrls[version], options, abortSignal);
	}
};

const nodeQueryFunction = (version: IpVersion, options: Options, abortSignal?: AbortSignal): Promise<string> =>
	(options.onlyHttps
		? queryHttps(version, httpsUrls[version], options, abortSignal)
		: queryAll(version, options, abortSignal));

/**
Get your public IPv4 address.

@returns Your public IPv4 address.
@throws On error or timeout.
*/
export const publicIpv4: IpFunction = createIpFunction('v4', nodeQueryFunction);

/**
Get your public IPv6 address.

@returns Your public IPv6 address.
@throws On error or timeout.
*/
export const publicIpv6: IpFunction = createIpFunction('v6', nodeQueryFunction);

/**
Get your public IP address.

In Node.js, it queries the DNS records of OpenDNS, Google DNS, and HTTPS services to determine your IP address.

@returns Your public IPv6 address or as a fallback, your public IPv4 address. Tries IPv6 first, then falls back to IPv4.
@throws On error or timeout.
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

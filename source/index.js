const {promisify} = require('node:util');
const dgram = require('node:dgram');
const dns = require('dns-socket');
const {createPublicIp, IpNotFoundError} = require('./core.js');
const {validateIp} = require('./utils.js');
const {queryHttps} = require('./query.js');
const {dnsServers, httpsUrls} = require('./constants.js');
const {createIpFunction} = require('./shared.js');

const createDnsQuery = (server, version, {name, type, transform}) => {
	const socket = dns({
		retries: 0,
		maxQueries: 1,
		socket: dgram.createSocket(version === 'v6' ? 'udp6' : 'udp4'),
		timeout: 30_000,
	});

	const socketQuery = promisify(socket.query.bind(socket));

	return (async () => {
		try {
			const dnsResponse = await socketQuery({questions: [{name, type}]}, 53, server);
			const {data} = dnsResponse.answers[0];
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

const queryDns = async version => {
	const queries = dnsServers.flatMap(serverConfig => {
		const {servers, ...question} = serverConfig[version];
		return servers.map(server => createDnsQuery(server, version, question));
	});

	try {
		return await Promise.any(queries);
	} catch (error) {
		const errors = error.errors ?? [];
		const lastError = errors.at?.(-1) ?? error;
		throw new IpNotFoundError({cause: lastError});
	}
};

const queryAll = async (version, options, abortSignal) => {
	try {
		return await queryDns(version);
	} catch {
		return queryHttps(version, httpsUrls[version], options, abortSignal);
	}
};

const nodeQueryFunction = (version, options, abortSignal) => options.onlyHttps
	? queryHttps(version, httpsUrls[version], options, abortSignal)
	: queryAll(version, options, abortSignal);

const publicIpv4 = createIpFunction('v4', nodeQueryFunction);
const publicIpv6 = createIpFunction('v6', nodeQueryFunction);
const publicIp = createPublicIp(publicIpv4, publicIpv6);

module.exports = {
	publicIpv4,
	publicIpv6,
	publicIp,
	IpNotFoundError,
};
module.exports.default = module.exports;

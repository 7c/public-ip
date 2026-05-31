"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpNotFoundError = exports.publicIp = exports.publicIpv6 = exports.publicIpv4 = void 0;
const node_util_1 = require("node:util");
const node_dgram_1 = __importDefault(require("node:dgram"));
const dns_socket_1 = __importDefault(require("dns-socket"));
const core_1 = require("./core");
Object.defineProperty(exports, "IpNotFoundError", { enumerable: true, get: function () { return core_1.IpNotFoundError; } });
const utils_1 = require("./utils");
const query_1 = require("./query");
const constants_1 = require("./constants");
const shared_1 = require("./shared");
const DNS_PORT = 53;
const DNS_TIMEOUT = 30_000;
const createDnsQuery = (server, version, { name, type, transform }) => {
    const socket = (0, dns_socket_1.default)({
        retries: 0,
        maxQueries: 1,
        socket: node_dgram_1.default.createSocket(version === 'v6' ? 'udp6' : 'udp4'),
        timeout: DNS_TIMEOUT,
    });
    const socketQuery = (0, node_util_1.promisify)(socket.query.bind(socket));
    return (async () => {
        try {
            const dnsResponse = await socketQuery({ questions: [{ name, type }] }, DNS_PORT, server);
            const answer = dnsResponse.answers[0];
            if (!answer) {
                throw new Error('Empty DNS response');
            }
            const { data } = answer;
            const response = (typeof data === 'string' ? data : data.toString()).trim();
            const ip = transform?.(response) ?? response;
            if ((0, utils_1.validateIp)(ip, version)) {
                return ip;
            }
            throw new Error('Invalid IP');
        }
        finally {
            socket.destroy();
        }
    })();
};
const queryDns = async (version) => {
    const queries = constants_1.dnsServers.flatMap(serverConfig => {
        const { servers, ...question } = serverConfig[version];
        return servers.map(server => createDnsQuery(server, version, question));
    });
    try {
        return await Promise.any(queries);
    }
    catch (error) {
        const lastError = error instanceof AggregateError && error.errors.length > 0
            ? error.errors.at(-1)
            : error;
        throw new core_1.IpNotFoundError({ cause: lastError });
    }
};
const queryAll = async (version, options, abortSignal) => {
    try {
        return await queryDns(version);
    }
    catch {
        return (0, query_1.queryHttps)(version, constants_1.httpsUrls[version], options, abortSignal);
    }
};
const nodeQueryFunction = (version, options, abortSignal) => (options.onlyHttps
    ? (0, query_1.queryHttps)(version, constants_1.httpsUrls[version], options, abortSignal)
    : queryAll(version, options, abortSignal));
/**
Get your public IPv4 address.

@returns Your public IPv4 address.
@throws On error or timeout.
*/
exports.publicIpv4 = (0, shared_1.createIpFunction)('v4', nodeQueryFunction);
/**
Get your public IPv6 address.

@returns Your public IPv6 address.
@throws On error or timeout.
*/
exports.publicIpv6 = (0, shared_1.createIpFunction)('v6', nodeQueryFunction);
/**
Get your public IP address.

In Node.js, it queries the DNS records of OpenDNS, Google DNS, and HTTPS services to determine your IP address.

@returns Your public IPv6 address or as a fallback, your public IPv4 address. Tries IPv6 first, then falls back to IPv4.
@throws On error or timeout.
*/
exports.publicIp = (0, core_1.createPublicIp)(exports.publicIpv4, exports.publicIpv6);
const publicIpModule = {
    publicIp: exports.publicIp,
    publicIpv4: exports.publicIpv4,
    publicIpv6: exports.publicIpv6,
    IpNotFoundError: core_1.IpNotFoundError,
};
exports.default = publicIpModule;
//# sourceMappingURL=index.js.map
import { IpNotFoundError } from './core';
import type { IpFunction } from './types';
/**
Get your public IPv4 address.

@returns Your public IPv4 address.
@throws On error or timeout.
*/
export declare const publicIpv4: IpFunction;
/**
Get your public IPv6 address.

@returns Your public IPv6 address.
@throws On error or timeout.
*/
export declare const publicIpv6: IpFunction;
/**
Get your public IP address.

In Node.js, it queries the DNS records of OpenDNS, Google DNS, and HTTPS services to determine your IP address.

@returns Your public IPv6 address or as a fallback, your public IPv4 address. Tries IPv6 first, then falls back to IPv4.
@throws On error or timeout.
*/
export declare const publicIp: IpFunction;
export { IpNotFoundError };
export type { Options, IpVersion } from './types';
declare const publicIpModule: {
    publicIp: IpFunction;
    publicIpv4: IpFunction;
    publicIpv6: IpFunction;
    IpNotFoundError: typeof IpNotFoundError;
};
export default publicIpModule;
//# sourceMappingURL=index.d.ts.map
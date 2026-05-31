import { IpNotFoundError } from './core';
import type { IpFunction } from './types';
/**
Get your public IPv4 address via HTTPS (browser).
*/
export declare const publicIpv4: IpFunction;
/**
Get your public IPv6 address via HTTPS (browser).
*/
export declare const publicIpv6: IpFunction;
/**
Get your public IP address via HTTPS (browser). Tries IPv6 first, then falls back to IPv4.
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
//# sourceMappingURL=browser.d.ts.map
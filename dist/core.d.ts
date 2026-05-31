import type { IpFunction } from './types';
/**
Thrown when the public IP address could not be found.
*/
export declare class IpNotFoundError extends Error {
    constructor(options?: ErrorOptions);
}
export declare const createPublicIp: (publicIpv4: IpFunction, publicIpv6: IpFunction) => IpFunction;
//# sourceMappingURL=core.d.ts.map
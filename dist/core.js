"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicIp = exports.IpNotFoundError = void 0;
/**
Thrown when the public IP address could not be found.
*/
class IpNotFoundError extends Error {
    constructor(options) {
        super('Could not get the public IP address', options);
        this.name = 'IpNotFoundError';
    }
}
exports.IpNotFoundError = IpNotFoundError;
const createPublicIp = (publicIpv4, publicIpv6) => async (options) => {
    try {
        return await publicIpv6(options);
    }
    catch (ipv6Error) {
        try {
            return await publicIpv4(options);
        }
        catch (ipv4Error) {
            throw new AggregateError([ipv4Error, ipv6Error]); // eslint-disable-line unicorn/error-message
        }
    }
};
exports.createPublicIp = createPublicIp;
//# sourceMappingURL=core.js.map
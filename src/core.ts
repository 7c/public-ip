import type {IpFunction} from './types';

/**
Thrown when the public IP address could not be found.
*/
export class IpNotFoundError extends Error {
	constructor(options?: ErrorOptions) {
		super('Could not get the public IP address', options);
		this.name = 'IpNotFoundError';
	}
}

export const createPublicIp = (publicIpv4: IpFunction, publicIpv6: IpFunction): IpFunction =>
	async options => {
		try {
			return await publicIpv6(options);
		} catch (ipv6Error) {
			try {
				return await publicIpv4(options);
			} catch (ipv4Error) {
				throw new AggregateError([ipv4Error, ipv6Error]); // eslint-disable-line unicorn/error-message
			}
		}
	};

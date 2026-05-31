/**
IP protocol version used internally to select endpoints and validation.
*/
export type IpVersion = 'v4' | 'v6';
export type Options = {
    /**
    Use a HTTPS check using the [icanhazip.com](https://github.com/major/icanhaz) service instead of the DNS query. [ipify.org](https://ipify.org) is used as a fallback if `icanhazip.com` fails. This check is much more secure and tamper-proof, but also a lot slower.

    __This option is only available in the Node.js version.__

    The default behaviour is to check against DNS before using HTTPS fallback. If set to `true`, it will *only* check against HTTPS.

    @default false
    */
    readonly onlyHttps?: boolean;
    /**
    The time in milliseconds until the operation is considered timed out. This applies to the entire operation, not individual requests.

    @default 5000
    */
    readonly timeout?: number;
    /**
    An `AbortSignal` to cancel the operation. If both `timeout` and `signal` are provided, the operation will be aborted when either the timeout is reached or the signal is aborted.
    */
    readonly signal?: AbortSignal;
    /**
    Add your own custom HTTPS endpoints to get the public IP from. They will only be used if everything else fails. Any service used as fallback *must* return the IP as a plain string.

    @default []

    @example
    ```
    const {publicIpv6} = require('@7c/public-ip');

    await publicIpv6({
        fallbackUrls: [
            'https://ifconfig.co/ip',
        ],
    });
    ```
    */
    readonly fallbackUrls?: readonly string[];
};
/**
A function that resolves the public IP address for a given protocol version.
*/
export type IpFunction = (options?: Options) => Promise<string>;
/**
The low-level query function used by {@link IpFunction} to fetch an IP for a version.
*/
export type QueryFunction = (version: IpVersion, options: Options, abortSignal?: AbortSignal) => Promise<string>;
//# sourceMappingURL=types.d.ts.map
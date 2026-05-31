import type { IpVersion } from './types';
export declare const validateIp: (ip: string, version: IpVersion) => boolean;
export declare const createAbortSignal: (timeout?: number, signal?: AbortSignal) => AbortSignal | undefined;
export declare const withAbortSignal: <T>(promise: Promise<T>, abortSignal?: AbortSignal) => Promise<T>;
//# sourceMappingURL=utils.d.ts.map
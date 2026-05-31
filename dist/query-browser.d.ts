import type { IpVersion, Options } from './types';
export declare const queryHttps: (version: IpVersion, urls: readonly string[], options?: Options, abortSignal?: AbortSignal) => Promise<string>;
export declare const createQuery: (_version: IpVersion, queryFunction: (abortSignal?: AbortSignal) => Promise<string>, options: Options) => Promise<string>;
//# sourceMappingURL=query-browser.d.ts.map
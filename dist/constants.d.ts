import type { IpVersion } from './types';
export type Defaults = {
    timeout: number;
    onlyHttps: boolean;
};
export declare const defaults: Defaults;
export type UrlMap = Record<IpVersion, string[]>;
export declare const httpsUrls: UrlMap;
export declare const browserUrls: UrlMap;
export type DnsQuestionConfig = {
    servers: string[];
    name: string;
    type: string;
    transform?: (ip: string) => string;
};
export type DnsServerConfig = Record<IpVersion, DnsQuestionConfig>;
export declare const dnsServers: DnsServerConfig[];
//# sourceMappingURL=constants.d.ts.map
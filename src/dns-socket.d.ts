declare module 'dns-socket' {
	import type {Socket} from 'node:dgram';

	type DnsSocketOptions = {
		retries?: number;
		maxQueries?: number;
		socket?: Socket;
		timeout?: number;
	};

	type DnsQuestion = {
		name: string;
		type: string;
	};

	type DnsQuery = {
		questions: DnsQuestion[];
	};

	type DnsAnswer = {
		data: string | Buffer;
	};

	type DnsResponse = {
		answers: DnsAnswer[];
	};

	type DnsSocketCallback = (error: Error | null, response: DnsResponse) => void;

	type DnsSocket = {
		query(query: DnsQuery, port: number, server: string, callback: DnsSocketCallback): void;
		destroy(): void;
	};

	function dnsSocket(options?: DnsSocketOptions): DnsSocket;

	export = dnsSocket;
}

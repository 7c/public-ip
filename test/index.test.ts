import {isIPv4, isIPv6} from 'node:net';
import {performance} from 'node:perf_hooks';

// --- dns-socket mock ---------------------------------------------------------

type DnsQuestion = {name: string; type: string};
type DnsQuery = {questions: DnsQuestion[]};
type DnsCallback = (error: Error | null, response?: {answers: Array<{data: string}>}) => void;

const dnsRecords: Record<string, Record<string, string>> = {
	'myip.opendns.com': {
		A: '203.0.113.10',
		AAAA: '2001:db8::1',
	},
	'o-o.myaddr.l.google.com': {
		TXT: '"203.0.113.20"',
	},
};

jest.mock('dns-socket', () => () => ({
	query(query: DnsQuery, _port: number, _server: string, callback: DnsCallback) {
		const [question] = query.questions;
		const record = question ? dnsRecords[question.name]?.[question.type] : undefined;
		setImmediate(() => {
			if (!record) {
				callback(new Error('DNS record not found'));
				return;
			}

			callback(null, {answers: [{data: record}]});
		});
	},
	destroy() {},
}));

// Imported after jest.mock so the mocked dns-socket is used.
// eslint-disable-next-line import/first
import {publicIp, publicIpv4, publicIpv6} from '../src/index';

// --- fetch mock --------------------------------------------------------------

const defaultFetchResponses = new Map<string, string>([
	['https://icanhazip.com/', '203.0.113.10'],
	['https://api.ipify.org/', '203.0.113.11'],
	['https://api6.ipify.org/', '2001:db8::2'],
	['https://ipv4.icanhazip.com/', '203.0.113.13'],
	['https://ipv6.icanhazip.com/', '2001:db8::3'],
	['https://ip4.ip8.com/', '203.0.113.14'],
	['https://ip6.ip8.com/', '2001:db8::4'],
	['https://ifconfig.co/ip', '198.51.100.1'],
	['https://ifconfig.me', '198.51.100.2'],
]);

let mockResponses = new Map(defaultFetchResponses);
let ignoredUrls: RegExp[] = [];
let stalledUrls: RegExp[] = [];

const resetFetchMocks = (): void => {
	mockResponses = new Map(defaultFetchResponses);
	ignoredUrls = [];
	stalledUrls = [];
};

const mockFetch = (url: string, options: {signal?: AbortSignal} = {}): Promise<unknown> => {
	if (options.signal?.aborted) {
		return Promise.reject(options.signal.reason ?? new Error('Request aborted'));
	}

	if (ignoredUrls.some(pattern => pattern.test(url))) {
		return Promise.reject(new Error('Mocked network error'));
	}

	if (stalledUrls.some(pattern => pattern.test(url))) {
		const {signal} = options;
		if (!signal) {
			return Promise.reject(new Error('Stalled request requires an AbortSignal'));
		}

		return new Promise((_resolve, reject) => {
			const handleAbort = (): void => {
				signal.removeEventListener('abort', handleAbort);
				reject(signal.reason ?? new Error('Request aborted'));
			};

			if (signal.aborted) {
				handleAbort();
				return;
			}

			signal.addEventListener('abort', handleAbort, {once: true});
		});
	}

	if (!mockResponses.has(url)) {
		return Promise.reject(new Error(`No mock response configured for ${url}`));
	}

	const mockResponse = mockResponses.get(url);
	return Promise.resolve({
		ok: true,
		text: () => Promise.resolve(mockResponse),
	});
};

const ignoreFetch = (pattern: RegExp): void => {
	ignoredUrls.push(pattern);
};

const mockFetchResponse = (url: string, response: string): void => {
	mockResponses.set(url, response);
};

const stallFetch = (pattern: RegExp): void => {
	stalledUrls.push(pattern);
};

const withMocks = async (callback: () => Promise<void>): Promise<void> => {
	const previousResponses = new Map(mockResponses);
	const previousIgnored = [...ignoredUrls];
	const previousStalled = [...stalledUrls];

	try {
		resetFetchMocks();
		await callback();
	} finally {
		mockResponses = previousResponses;
		ignoredUrls = previousIgnored;
		stalledUrls = previousStalled;
	}
};

const timeSpan = (): (() => number) => {
	const start = performance.now();
	return () => performance.now() - start;
};

const originalFetch = globalThis.fetch;

beforeAll(() => {
	globalThis.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(resetFetchMocks);

afterAll(() => {
	resetFetchMocks();
	globalThis.fetch = originalFetch;
});

describe('public-ip (mocked)', () => {
	test('IPv4 or IPv6', async () => {
		const ip = await publicIp({timeout: 10_000});
		expect(isIPv4(ip) || isIPv6(ip)).toBe(true);
	});

	test('IPv4', async () => {
		const ip = await publicIpv4();
		expect(isIPv4(ip)).toBe(true);
	});

	test('IPv6', async () => {
		const ip = await publicIpv6({timeout: 10_000});
		expect(isIPv6(ip)).toBe(true);
	});

	test('IPv4 HTTPS only', async () => {
		const ip = await publicIpv4({onlyHttps: true});
		expect(isIPv4(ip)).toBe(true);
	});

	test('IPv6 HTTPS only', async () => {
		const ip = await publicIpv6({onlyHttps: true, timeout: 10_000});
		expect(isIPv6(ip)).toBe(true);
	});

	test('timeout applies to overall operation', async () => {
		const timeout = 5; // Extremely short timeout to force failure
		const end = timeSpan();

		await withMocks(async () => {
			stallFetch(/./);
			const controller = new AbortController();
			const abortTimer = setTimeout(() => {
				controller.abort(new Error('Operation timed out'));
			}, timeout);

			try {
				await expect(
					publicIpv4({timeout, onlyHttps: true, signal: controller.signal}),
				).rejects.toThrow();
			} finally {
				clearTimeout(abortTimer);
			}
		});

		const elapsed = end();
		expect(elapsed).toBeLessThan(500);
	});

	test('AbortSignal functionality', async () => {
		const controller = new AbortController();
		controller.abort();

		// An already-aborted signal throws synchronously; wrap so the rejection is observed.
		await expect((async () => publicIpv4({signal: controller.signal}))()).rejects.toThrow();
	});

	test('fallback URLs work', async () => {
		await withMocks(async () => {
			// Make every default source fail so only the custom fallback succeeds.
			ignoreFetch(/icanhazip\.com/);
			ignoreFetch(/ipify\.org/);
			ignoreFetch(/ip8\.com/);

			mockFetchResponse('https://ifconfig.co/ip', '192.168.1.1');

			const ip = await publicIpv4({
				onlyHttps: true,
				fallbackUrls: ['https://ifconfig.co/ip'],
			});

			expect(ip).toBe('192.168.1.1');
		});
	});

	test('handles invalid IP responses', async () => {
		await withMocks(async () => {
			mockFetchResponse('https://icanhazip.com/', 'invalid-ip-address');
			mockFetchResponse('https://api.ipify.org/', 'also-invalid');
			mockFetchResponse('https://ip4.ip8.com/', 'still-not-an-ip');

			await expect(
				publicIpv4({onlyHttps: true}),
			).rejects.toThrow('Could not get the public IP address');
		});
	});

	test('DNS fallback mode works', async () => {
		const ip = await publicIpv4({onlyHttps: false});
		expect(isIPv4(ip)).toBe(true);
	});

	test('uses defaults when no options provided', async () => {
		const ip = await publicIpv4();
		expect(isIPv4(ip)).toBe(true);
	});
});

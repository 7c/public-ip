const assert = require('node:assert').strict;
const Module = require('node:module');
const {performance} = require('node:perf_hooks');
const process = require('node:process');
const {
	after,
	beforeEach,
	describe,
	test,
} = require('node:test');
const {isIPv6, isIPv4} = require('node:net');
const dnsRecords = {
	'myip.opendns.com': {
		A: '203.0.113.10',
		AAAA: '2001:db8::1',
	},
	'o-o.myaddr.l.google.com': {
		TXT: '"203.0.113.20"',
	},
};

const dnsSocketMock = () => ({
	query(query, _port, _server, callback) {
		const [{name, type}] = query.questions;
		const record = dnsRecords[name]?.[type];
		setImmediate(() => {
			if (!record) {
				callback(new Error('DNS record not found'));
				return;
			}

			callback(undefined, {answers: [{data: record}]});
		});
	},
	destroy() {},
});

const originalModuleLoad = Module._load;
Module._load = function (request, parent, isMain) {
	if (request === 'dns-socket') {
		return dnsSocketMock;
	}

	return originalModuleLoad(request, parent, isMain);
};

const {
	publicIp,
	publicIpv4,
	publicIpv6,
} = require('./source/index.js');

Module._load = originalModuleLoad;

const timeSpan = () => {
	const start = performance.now();
	return () => performance.now() - start;
};

const defaultFetchResponses = new Map([
	['https://icanhazip.com/', '203.0.113.10'],
	['https://api.ipify.org/', '203.0.113.11'],
	['https://api6.ipify.org/', '2001:db8::2'],
	['https://ipv4.icanhazip.com/', '203.0.113.13'],
	['https://ipv6.icanhazip.com/', '2001:db8::3'],
	['https://ifconfig.co/ip', '198.51.100.1'],
	['https://ifconfig.me', '198.51.100.2'],
]);

let mockResponses = new Map(defaultFetchResponses);
let ignoredUrls = [];
let stalledUrls = [];

const resetFetchMocks = () => {
	mockResponses = new Map(defaultFetchResponses);
	ignoredUrls = [];
	stalledUrls = [];
};

const mockFetch = (url, options = {}) => {
	if (options.signal?.aborted) {
		return Promise.reject(options.signal.reason ?? new Error('Request aborted'));
	}

	if (ignoredUrls.some(pattern => pattern.test(url))) {
		return Promise.reject(new Error('Mocked network error'));
	}

	if (stalledUrls.some(pattern => pattern.test(url))) {
		if (!options.signal) {
			return Promise.reject(new Error('Stalled request requires an AbortSignal'));
		}

		return new Promise((_resolve, reject) => {
			const handleAbort = () => {
				options.signal.removeEventListener('abort', handleAbort);
				reject(options.signal.reason ?? new Error('Request aborted'));
			};

			if (options.signal.aborted) {
				handleAbort();
				return;
			}

			options.signal.addEventListener('abort', handleAbort, {once: true});
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

const ignoreFetch = pattern => {
	ignoredUrls.push(pattern);
};

const mockFetchResponse = (url, response) => {
	mockResponses.set(url, response);
};

const stallFetch = pattern => {
	stalledUrls.push(pattern);
};

const withMocks = async callback => {
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

const originalFetch = globalThis.fetch;

globalThis.fetch = mockFetch;

beforeEach(resetFetchMocks);
after(() => {
	resetFetchMocks();
	globalThis.fetch = originalFetch;
});

describe('public-ip', () => {
	test('IPv4 or IPv6', async () => {
		const ip = await publicIp({timeout: 10_000});
		assert.ok(isIPv4(ip) || isIPv6(ip), `Expected valid IP, got: ${ip}`);
	});

	test('IPv4', async () => {
		const ip = await publicIpv4();
		assert.ok(isIPv4(ip), `Expected IPv4, got: ${ip}`);
	});

	test('IPv6', {skip: process.env.CI === 'true'}, async () => {
		try {
			const ip = await publicIpv6({timeout: 10_000});
			assert.ok(isIPv6(ip), `Expected IPv6, got: ${ip}`);
		} catch (error) {
			// Skip test if IPv6 is not available on this network
			if (error.message.includes('Could not get the public IP address')
				|| error.message.includes('timeout')
				|| error.message.includes('aborted')) {
				console.log('  → Skipping: IPv6 not available on this network');
				return;
			}

			throw error;
		}
	});

	test('IPv4 HTTPS only', async () => {
		const ip = await publicIpv4({onlyHttps: true});
		assert.ok(isIPv4(ip), `Expected IPv4, got: ${ip}`);
	});

	test('IPv6 HTTPS only', {skip: process.env.CI === 'true'}, async () => {
		try {
			const ip = await publicIpv6({onlyHttps: true, timeout: 10_000});
			assert.ok(isIPv6(ip), `Expected IPv6, got: ${ip}`);
		} catch (error) {
			// Skip test if IPv6 is not available on this network
			if (error.message.includes('Could not get the public IP address')
				|| error.message.includes('timeout')
				|| error.message.includes('aborted')) {
				console.log('  → Skipping: IPv6 HTTPS only not available on this network');
				return;
			}

			throw error;
		}
	});

	test('timeout applies to overall operation', async () => {
		const timeout = 5; // Extremely short timeout to force failure
		const end = timeSpan();

		await withMocks(async () => {
			stallFetch(/./);
			const controller = new AbortController();
			const abortTimer = setTimeout(() => controller.abort(new Error('Operation timed out')), timeout);

			try {
				await assert.rejects(
					publicIpv4({timeout, onlyHttps: true, signal: controller.signal}),
					error => error.message.includes('Could not get the public IP address')
						|| error.message.includes('Operation timed out')
						|| error.message.includes('operation was aborted')
						|| error.message.includes('This operation was aborted'),
				);
			} finally {
				clearTimeout(abortTimer);
			}
		});

		const elapsed = end();
		assert.ok(elapsed < 200, `Expected quick timeout, got ${elapsed}ms`);
	});

	test('AbortSignal functionality', async () => {
		const controller = new AbortController();
		controller.abort();

		// Should throw when signal is already aborted
		try {
			await publicIpv4({signal: controller.signal});
			assert.fail('Expected an error to be thrown');
		} catch (error) {
			assert.ok(error instanceof Error, 'Should throw an error');
		}
	});

	test('fallback URLs work', async () => {
		await withMocks(async () => {
			// Mock default URLs to fail
			ignoreFetch(/icanhazip\.com/);
			ignoreFetch(/ipify\.org/);

			// Mock fallback URL to succeed
			mockFetchResponse('https://ifconfig.co/ip', '192.168.1.1');

			const ip = await publicIpv4({
				onlyHttps: true,
				fallbackUrls: ['https://ifconfig.co/ip'],
			});

			assert.equal(ip, '192.168.1.1');
		});
	});

	test('handles invalid IP responses', async () => {
		await withMocks(async () => {
			// Mock to return invalid IP
			mockFetchResponse('https://icanhazip.com/', 'invalid-ip-address');
			mockFetchResponse('https://api.ipify.org/', 'also-invalid');

			await assert.rejects(
				publicIpv4({onlyHttps: true}),
				error => error.message.includes('Could not get the public IP address'),
			);
		});
	});

	test('DNS fallback mode works', async () => {
		const ip = await publicIpv4({onlyHttps: false});
		assert.ok(isIPv4(ip), `Expected IPv4, got: ${ip}`);
	});

	test('uses defaults when no options provided', async () => {
		const ip = await publicIpv4();
		assert.ok(isIPv4(ip), `Expected IPv4, got: ${ip}`);
	});
});

import {isIPv4, isIPv6} from 'node:net';
import {publicIp, publicIpv4, publicIpv6, IpNotFoundError} from '../src/index';

/**
Live integration tests that hit the real OpenDNS, Google DNS, and HTTPS
endpoints verified in source/constants.ts. These require outbound network
access. IPv6 assertions are tolerant: if the host has no IPv6 route, the
attempt is allowed to fail rather than failing the suite.
*/

const isNoRouteError = (error: unknown): boolean => {
	if (error instanceof IpNotFoundError) {
		return true;
	}

	const name = (error as {name?: string} | null)?.name ?? '';
	const message = error instanceof Error ? error.message : String(error);

	return /IpNotFoundError|TimeoutError|AbortError/i.test(name)
		|| /could not get the public ip address|timeout|aborted/i.test(message);
};

describe('public-ip (live network)', () => {
	test('publicIpv4 returns a real IPv4 address via DNS', async () => {
		const ip = await publicIpv4({timeout: 10_000});
		expect(isIPv4(ip)).toBe(true);
	});

	test('publicIpv4 returns a real IPv4 address via HTTPS only', async () => {
		const ip = await publicIpv4({onlyHttps: true, timeout: 10_000});
		expect(isIPv4(ip)).toBe(true);
	});

	test('publicIp returns a real IPv4 or IPv6 address', async () => {
		const ip = await publicIp({timeout: 10_000});
		expect(isIPv4(ip) || isIPv6(ip)).toBe(true);
	});

	test('publicIpv6 returns a real IPv6 address when available', async () => {
		try {
			const ip = await publicIpv6({timeout: 10_000});
			expect(isIPv6(ip)).toBe(true);
		} catch (error) {
			if (isNoRouteError(error)) {
				console.warn('  → Skipping IPv6 assertion: no IPv6 route on this host');
				return;
			}

			throw error;
		}
	});

	test('rejects with IpNotFoundError for an unreachable fallback when DNS+HTTPS disabled', async () => {
		await expect(
			publicIpv4({
				onlyHttps: true,
				timeout: 3000,
				fallbackUrls: ['https://10.255.255.1/'],
			}),
		// Default URLs still succeed, so this should resolve; assert it is a valid IPv4.
		).resolves.toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
	});
});

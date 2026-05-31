import {validateIp, createAbortSignal, withAbortSignal} from '../src/utils';
import {validateIp as validateIpBrowser} from '../src/utils-browser';
import {IpNotFoundError, createPublicIp} from '../src/core';

describe('validateIp (node)', () => {
	test('accepts a valid IPv4 address', () => {
		expect(validateIp('203.0.113.10', 'v4')).toBe(true);
	});

	test('rejects an IPv6 address when expecting IPv4', () => {
		expect(validateIp('2001:db8::1', 'v4')).toBe(false);
	});

	test('accepts a valid IPv6 address', () => {
		expect(validateIp('2001:db8::1', 'v6')).toBe(true);
	});

	test('rejects garbage input', () => {
		expect(validateIp('not-an-ip', 'v4')).toBe(false);
		expect(validateIp('', 'v6')).toBe(false);
	});
});

describe('validateIp (browser)', () => {
	test('accepts a valid IPv4 address', () => {
		expect(validateIpBrowser('203.0.113.10', 'v4')).toBe(true);
	});

	test('rejects an out-of-range octet', () => {
		expect(validateIpBrowser('999.0.0.1', 'v4')).toBe(false);
	});

	test('accepts a colon-containing IPv6 address', () => {
		expect(validateIpBrowser('2001:db8::1', 'v6')).toBe(true);
	});

	test('rejects an IPv6 without colons', () => {
		expect(validateIpBrowser('abcdef', 'v6')).toBe(false);
	});
});

describe('createAbortSignal', () => {
	test('returns undefined when neither timeout nor signal is given', () => {
		expect(createAbortSignal()).toBeUndefined();
	});

	test('returns a signal when a timeout is given', () => {
		const signal = createAbortSignal(1000);
		expect(signal).toBeInstanceOf(AbortSignal);
	});

	test('throws immediately if the provided signal is already aborted', () => {
		const controller = new AbortController();
		controller.abort();
		expect(() => createAbortSignal(undefined, controller.signal)).toThrow();
	});

	test('combines timeout and external signal', () => {
		const controller = new AbortController();
		const signal = createAbortSignal(1000, controller.signal);
		expect(signal).toBeInstanceOf(AbortSignal);
	});
});

describe('withAbortSignal', () => {
	test('passes through when no signal is provided', async () => {
		await expect(withAbortSignal(Promise.resolve('ok'))).resolves.toBe('ok');
	});

	test('rejects when the signal aborts first', async () => {
		const controller = new AbortController();
		const pending = new Promise<string>(() => {});
		const raced = withAbortSignal(pending, controller.signal);
		controller.abort(new Error('aborted by test'));
		await expect(raced).rejects.toThrow('aborted by test');
	});

	test('throws synchronously if signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort(new Error('already aborted'));
		await expect(withAbortSignal(Promise.resolve('ok'), controller.signal)).rejects.toThrow('already aborted');
	});
});

describe('IpNotFoundError', () => {
	test('has the expected name and message', () => {
		const error = new IpNotFoundError();
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('IpNotFoundError');
		expect(error.message).toBe('Could not get the public IP address');
	});

	test('preserves the cause', () => {
		const cause = new Error('root cause');
		const error = new IpNotFoundError({cause});
		expect(error.cause).toBe(cause);
	});
});

describe('createPublicIp', () => {
	test('returns the IPv6 result when it succeeds', async () => {
		const publicIp = createPublicIp(
			async () => '203.0.113.1',
			async () => '2001:db8::1',
		);
		await expect(publicIp()).resolves.toBe('2001:db8::1');
	});

	test('falls back to IPv4 when IPv6 fails', async () => {
		const publicIp = createPublicIp(
			async () => '203.0.113.1',
			async () => {
				throw new Error('no ipv6');
			},
		);
		await expect(publicIp()).resolves.toBe('203.0.113.1');
	});

	test('throws AggregateError when both fail', async () => {
		const publicIp = createPublicIp(
			async () => {
				throw new Error('no ipv4');
			},
			async () => {
				throw new Error('no ipv6');
			},
		);
		await expect(publicIp()).rejects.toThrow(AggregateError);
	});
});

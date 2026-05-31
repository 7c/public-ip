/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	testEnvironment: 'node',
	roots: ['<rootDir>/test'],
	testMatch: ['**/*.test.ts'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {tsconfig: 'tsconfig.test.json'}],
	},
	// Live network tests are slow; allow generous per-test timeout.
	testTimeout: 30_000,
};

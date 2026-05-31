"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAbortSignal = exports.createAbortSignal = exports.validateIp = void 0;
const node_net_1 = require("node:net");
const validateIp = (ip, version) => Boolean(ip && (version === 'v6' ? (0, node_net_1.isIPv6)(ip) : (0, node_net_1.isIPv4)(ip)));
exports.validateIp = validateIp;
const createAbortSignal = (timeout, signal) => {
    if (signal) {
        signal.throwIfAborted();
    }
    if (!timeout && !signal) {
        return undefined;
    }
    const signals = [];
    if (timeout) {
        signals.push(AbortSignal.timeout(timeout));
    }
    if (signal) {
        signals.push(signal);
    }
    return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
};
exports.createAbortSignal = createAbortSignal;
const withAbortSignal = async (promise, abortSignal) => {
    if (!abortSignal) {
        return promise;
    }
    abortSignal.throwIfAborted();
    const abortPromise = new Promise((_resolve, reject) => {
        abortSignal.addEventListener('abort', () => {
            reject(abortSignal.reason);
        }, { once: true });
    });
    return Promise.race([promise, abortPromise]);
};
exports.withAbortSignal = withAbortSignal;
//# sourceMappingURL=utils.js.map
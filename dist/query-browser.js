"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuery = exports.queryHttps = void 0;
const core_1 = require("./core");
const utils_browser_1 = require("./utils-browser");
const lastAggregateError = (error) => (error instanceof AggregateError && error.errors.length > 0 ? error.errors.at(-1) : error);
const queryHttps = async (version, urls, options = {}, abortSignal) => {
    const urlList = [
        ...urls,
        ...(options.fallbackUrls ?? []),
    ];
    const requests = urlList.map(async (url) => {
        const response = await fetch(url, { signal: abortSignal });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const responseText = await response.text();
        const ip = responseText.trim();
        if ((0, utils_browser_1.validateIp)(ip, version)) {
            return ip;
        }
        throw new Error('Invalid IP');
    });
    try {
        return await Promise.any(requests);
    }
    catch (error) {
        throw new core_1.IpNotFoundError({ cause: lastAggregateError(error) });
    }
};
exports.queryHttps = queryHttps;
const createQuery = (_version, queryFunction, options) => {
    const abortSignal = (0, utils_browser_1.createAbortSignal)(options.timeout, options.signal);
    return (0, utils_browser_1.withAbortSignal)(queryFunction(abortSignal), abortSignal);
};
exports.createQuery = createQuery;
//# sourceMappingURL=query-browser.js.map
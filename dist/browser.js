"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpNotFoundError = exports.publicIp = exports.publicIpv6 = exports.publicIpv4 = void 0;
const core_1 = require("./core");
Object.defineProperty(exports, "IpNotFoundError", { enumerable: true, get: function () { return core_1.IpNotFoundError; } });
const query_browser_1 = require("./query-browser");
const constants_1 = require("./constants");
const shared_browser_1 = require("./shared-browser");
const browserQueryFunction = (version, options, abortSignal) => (0, query_browser_1.queryHttps)(version, constants_1.browserUrls[version], options, abortSignal);
/**
Get your public IPv4 address via HTTPS (browser).
*/
exports.publicIpv4 = (0, shared_browser_1.createIpFunction)('v4', browserQueryFunction);
/**
Get your public IPv6 address via HTTPS (browser).
*/
exports.publicIpv6 = (0, shared_browser_1.createIpFunction)('v6', browserQueryFunction);
/**
Get your public IP address via HTTPS (browser). Tries IPv6 first, then falls back to IPv4.
*/
exports.publicIp = (0, core_1.createPublicIp)(exports.publicIpv4, exports.publicIpv6);
const publicIpModule = {
    publicIp: exports.publicIp,
    publicIpv4: exports.publicIpv4,
    publicIpv6: exports.publicIpv6,
    IpNotFoundError: core_1.IpNotFoundError,
};
exports.default = publicIpModule;
//# sourceMappingURL=browser.js.map
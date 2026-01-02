const {createPublicIp, IpNotFoundError} = require('./core.js');
const {queryHttps} = require('./query-browser.js');
const {browserUrls} = require('./constants.js');
const {createIpFunction} = require('./shared-browser.js');

const browserQueryFunction = (version, options, abortSignal) => queryHttps(version, browserUrls[version], options, abortSignal);

const publicIpv4 = createIpFunction('v4', browserQueryFunction);
const publicIpv6 = createIpFunction('v6', browserQueryFunction);
const publicIp = createPublicIp(publicIpv4, publicIpv6);

module.exports = {
	publicIpv4,
	publicIpv6,
	publicIp,
	IpNotFoundError,
};
module.exports.default = module.exports;

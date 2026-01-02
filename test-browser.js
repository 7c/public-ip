const process = require('node:process');
const {publicIp, publicIpv4} = require('./source/browser.js');

const run = async () => {
	console.log('IP:', await publicIpv4());

	console.log('IP:', await publicIpv4({
		fallbackUrls: [
			'https://ifconfig.me',
		],
	}));

	console.log('IP:', await publicIp());
};

run().catch(error => {
	console.error(error);
	process.exitCode = 1;
});

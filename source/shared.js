const {createQuery} = require('./query.js');
const {defaults} = require('./constants.js');

const createIpFunction = (version, queryFunction) => (options = {}) => {
	const mergedOptions = {
		...defaults,
		...options,
	};

	return createQuery(
		version,
		abortSignal => queryFunction(version, mergedOptions, abortSignal),
		mergedOptions,
	);
};

module.exports = {createIpFunction};

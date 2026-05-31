"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIpFunction = void 0;
const query_1 = require("./query");
const constants_1 = require("./constants");
const createIpFunction = (version, queryFunction) => (options = {}) => {
    const mergedOptions = {
        ...constants_1.defaults,
        ...options,
    };
    return (0, query_1.createQuery)(version, abortSignal => queryFunction(version, mergedOptions, abortSignal), mergedOptions);
};
exports.createIpFunction = createIpFunction;
//# sourceMappingURL=shared.js.map
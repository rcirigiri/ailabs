/**
 * All common helper methods goes here
 */

const {Handle200Response} = require('./responseHandler');

/**
 * Health check default api response
 * @param {*} res response instance
 * @returns response data
 */
exports.healthCheckAPIResponse = res => {
  return Handle200Response(res, {message: 'API Server Running.'});
};

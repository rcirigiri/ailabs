const httpStatus = require('http-status');
const {LOG_LEVELS} = require('../utils/constants');
/**
 * Contains all the functions to handle API responses.
 */

module.exports = {
  /**
   * Handle 200 success response
   *
   * @protected
   * @function Handle200Response
   * @param res response instance
   * @param data object data to return in response
   * @return {object} json object with response message.
   */
  Handle200Response: (res, data) => {
    res.status(200).json(data);
    return res.end();
  },
  /**
   * Handle 404 Not Found error response
   *
   * @protected
   * @function Handle404Error
   * @param res response instance
   * @return {object} json object with error message.
   */
  Handle404Error: (req, res, next) => {
    res.status(404).json({
      error:
        '404 ' + httpStatus[404] + ' : The specified resource is not found',
    });
    return res.end();
  },
  /**
   * Handle 400 Bad Request error response
   *
   * @protected
   * @function Handle400Error
   * @param res response instance
   * @return {object} json object with error message.
   */
  Handle400Error: (res, data) => {
    res.status(400).json({
      error: data ?? '400 ' + httpStatus[400],
    });
    return res.end();
  },
  /**
   * Handle 401 Unauthorized error response
   *
   * @protected
   * @function Handle401Error
   * @param res response instance
   * @return {object} json object with error message.
   */
  Handle401Error: res => {
    res.status(401).json({
      error:
        '401 ' +
        httpStatus[401] +
        ' : Authorization information is missing or invalid.',
    });
    return res.end();
  },
  /**
   * Handle 403 Forbidden error response
   *
   * @protected
   * @function Handle403Error
   * @param res response instance
   * @return {object} json object with error message.
   */
  Handle403Error: res => {
    res.status(403).json({
      error: '403 ' + httpStatus[403] + ' : Access Denied',
    });
    return res.end();
  },
  /**
   * Handle 500 Unexpected error response
   *
   * @protected
   * @function Handle500Error
   * @param res response instance
   * @return {object} json object with error message.
   */
  Handle500Error: (err, req, res, next) => {
    const errLog = {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      post: req.body,
      error: err.message,
      stack: err,
    };
    // Temporary console log for debug mode
    console.log('\n', errLog, LOG_LEVELS.ERROR);

    res.status(500).json({
      error:
        '500 ' +
        httpStatus[500] +
        ' : Something went wrong. Please contact support team.',
    });
    return res.end();
  },
};

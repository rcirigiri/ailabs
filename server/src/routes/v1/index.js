const express = require('express');
const {healthCheckAPIResponse} = require('../../helpers');
const {VerifyToken} = require('../../middlewares');
const router = express.Router();

/**
 * Public APIs
 */
router.get('/', (req, res) => healthCheckAPIResponse(res));
/**
 * @openapi
 * /health-check:
 *  get:
 *     tags:
 *     - Utils
 *     summary: Returns API operational status
 *     responses:
 *       200:
 *         $ref: '#/components/schemaExamples/utils/healthCheck/response'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401AuthenticationFailed'
 *       500:
 *         $ref: '#/components/responses/5XXUnexpectedError'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *
 */
router.get('/health-check', (req, res) => healthCheckAPIResponse(res));
router.use('/auth', require('./auth'));

/**
 * Protected APIs
 */
//router.use(VerifyToken);
router.get('/health-check-protected', (req, res) =>
  healthCheckAPIResponse(res),
);

module.exports = router;

const express = require('express');
const router = express.Router();
const {healthCheckAPIResponse} = require('../helpers');
const {VerifyToken} = require('../middlewares');

router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * PUBLIC routes here
 */

router.get('/', (req, res) => healthCheckAPIResponse(res));
router.use('/v1', require('./v1'));

module.exports = router;

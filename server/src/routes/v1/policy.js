const express = require('express');
const {Policy} = require('../../controllers');

const router = express.Router();

router.post('/register-policy', Policy.CreateNewPolicy);

module.exports = router;

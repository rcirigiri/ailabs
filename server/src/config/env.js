const path = require('path');
const dotenv = require('dotenv').config();
const dotenvExample = require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.example'),
});

if (
  Object !== null &&
  JSON.stringify(Object.keys(dotenv.parsed).sort()) !==
    JSON.stringify(Object.keys(dotenvExample.parsed).sort())
) {
  throw Error('Missing values in .env. Please refer to .env.example');
}

/**
 * Export all env variables and constant
 * @public
 */

module.exports = {
  port: Number(process.env['PORT']),
  mongodb: process.env['MONGO_CONNECTION_STRING'],
  db_name: process.env['MONGO_DB_NAME'],
  secret: process.env['JWT_SECRET'],
  env: process.env['NODE_ENV'],
  token_expiry_limit: Number(process.env['JWT_ACCESS_EXPIRATION_MINUTES']),
  host_url: process.env['HOST_URL'],
};

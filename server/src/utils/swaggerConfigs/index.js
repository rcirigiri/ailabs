const utils = require('./healthCheck');
const auth = require('./auth');

/**
 * Swagger Tags and their respective descriptions
 */
exports.SWAGGER_TAGS = [
  {
    name: 'Auth',
    description: 'Endpoints for authentications',
  },
  {
    name: 'Utils',
    description: 'Utility endpoints like server health check',
  },
];

/**
 * All the swagger success response examples
 */
exports.SCHEMA_EXAMPLES = {
  utils,
  auth,
};

/**
 * Swagger common error responses
 */
exports.RESPONSES = {
  '404NotFound': {
    description: '404 Error.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: '404 Not Found : The specified resource is not found',
            },
          },
        },
      },
    },
  },
  '400BadRequest': {
    description: 'Bad request.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid email id',
            },
          },
        },
      },
    },
  },
  '401AuthenticationFailed': {
    description: 'Authorization information is missing or invalid.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: '401 Authorization information is missing or invalid.',
            },
          },
        },
      },
    },
  },
  '403Forbidden': {
    description: '403 Forbidden',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: '403 Access forbidden.',
            },
          },
        },
      },
    },
  },
  '5XXUnexpectedError': {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: '500 Unexpected error. Please contact support team.',
            },
          },
        },
      },
    },
  },
};

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {env} = require('./index');
const {RESPONSES, SWAGGER_TAGS, SCHEMA_EXAMPLES} = require('../utils');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Swagger API Docs',
      description: 'API endpoints documented on swagger',
      contact: {
        name: 'Development Team',
        email: 'info@ditinex.com',
        url: 'https://www.ditinex.com',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
      version: '1.0.0',
      externalDocs: {
        description: 'Find out more',
        url: 'https://www.ditinex.com',
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: RESPONSES,
      schemaExamples: SCHEMA_EXAMPLES,
    },
    servers: [
      {
        url:
          '{protocol}://' +
          env.host_url.replace('http://', '').replace('https://', '') +
          '/{basePath}',
        description: 'Local server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http',
          },
          basePath: {
            enum: ['v1'],
            default: 'v1',
          },
        },
      },
      {
        url: '<your live url here>',
        description: 'Staging server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'https',
          },
          basePath: {
            enum: ['v1'],
            default: 'v1',
          },
        },
      },
    ],
    tags: SWAGGER_TAGS,
  },
  // looks for configuration in specified directories
  apis: ['./src/routes/*/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Create swagger api doc and route
 *
 * @returns {void}
 * @public
 */
exports.swaggerDocs = app => {
  // Swagger Page
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Documentation in JSON format
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

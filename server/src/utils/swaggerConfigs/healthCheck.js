module.exports = {
  healthCheck: {
    body: {},
    params: {},
    response: {
      description: '200 Response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'API Server Running.',
              },
            },
          },
        },
      },
    },
  },
};

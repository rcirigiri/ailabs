module.exports = {
  /**
   * Schema for business registration
   */
  registerBusiness: {
    body: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['business', 'user'],
            properties: {
              business: {
                type: 'object',
                required: ['name', 'type', 'email', 'mobile', 'address'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'Ditinex',
                    description: 'Name of the business',
                  },
                  type: {
                    type: 'string',
                    example: 'Software Company',
                    description: 'Type of business',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'admin@ditinex.com',
                    description: 'Contact email for the business',
                  },
                  mobile: {
                    type: 'string',
                    example: '919903614705',
                    description: 'Contact mobile number of the business',
                  },
                  address: {
                    type: 'string',
                    example: 'Kolkata, WB',
                    description: 'Physical address of the business',
                  },
                  amenities: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['Music', 'Game'],
                    description: 'Amenities offered by the business',
                  },
                  about_us: {
                    type: 'string',
                    example: 'We are a software company',
                    description: 'Description about the business',
                  },
                },
              },
              user: {
                type: 'object',
                required: [
                  'first_name',
                  'last_name',
                  'email',
                  'password',
                  'confirm_password',
                ],
                properties: {
                  first_name: {
                    type: 'string',
                    example: 'Asif',
                    description: 'First name of the user',
                  },
                  last_name: {
                    type: 'string',
                    example: 'Akram',
                    description: 'Last name of the user',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'asifakramsk@gmail.com',
                    description: 'Email address of the user',
                  },
                  password: {
                    type: 'string',
                    example: 'asifakramsk',
                    description: 'Password for the user account',
                  },
                  confirm_password: {
                    type: 'string',
                    example: 'asifakramsk',
                    description: 'Password confirmation for the user account',
                  },
                },
              },
            },
          },
        },
      },
    },
    params: {
      in: 'query',
      name: 'userId',
      schema: {
        type: 'boolean',
      },
      required: false,
      description: 'Specifies if the response should include a welcome message',
    },
    response: {
      description: '200 Response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              first_name: {
                type: 'string',
                example: 'Asif',
              },
              last_name: {
                type: 'string',
                example: 'Akram',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'asifakramsk@gmail.com',
              },
              status: {
                type: 'string',
                example: 'ACTIVE',
              },
              refresh_token: {
                type: 'string',
                example: 'O4EGz9MR7Oj35ACV1Toi',
              },
              _id: {
                type: 'string',
                example: '6722a54ff3031774ad429414',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T21:29:51.424Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T21:29:51.424Z',
              },
              role: {
                type: 'object',
                properties: {
                  _id: {
                    type: 'string',
                    example: '67226dafb53719217efd205a',
                  },
                  role_name: {
                    type: 'string',
                    example: 'BUSINESS MANAGER',
                  },
                },
              },
              access_token_expiry: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T22:29:51.469Z',
              },
              access_token: {
                type: 'string',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkX3VzZXJfZGV0YWlscyI6eyJmaXJzdF9uYW1lIjoiQXNpZiIsImxhc3RfbmFtZSI6IkFrcmFtIiwiZW1haWwiOiJhc2lmYWtyYW1za0BnbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRyVllqSUY1aUN3bEIuVEVmSEZHVlcuQVFNZ0VqamNNMWI1WFQvOXNiL1VwRm1mWVhVVkpuSyIsInJvbGVfaWQiOiI2NzIyNmRhZmI1MzcxOTIxN2VmZDIwNWEiLCJzdGF0dXMiOiJBQ1RJVkUiLCJmb3JjZV9wYXNzd29yZF9jaGFuZ2UiOmZhbHNlLCJyZWZyZXNoX3Rva2VuIjoiTzRFR3o5TVI3T2ozNUFDVjFUb2kiLCJfaWQiOiI2NzIyYTU0ZmYzMDMxNzc0YWQ0Mjk0MTQiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTMwVDIxOjI5OjUxLjQyNFoiLCJ1cGRhdGVkQXQiOiIyMDI0LTEwLTMwVDIxOjI5OjUxLjQyNFoiLCJfX3YiOjB9LCJpYXQiOjE3MzAzMjM3OTEsImV4cCI6MTczMDMyNzM5MX0.EzrEYrCUXsf2VyMcDuEnNOprh8tNMwylOD8FLwrgY3Q',
              },
            },
          },
        },
      },
    },
  },
  login: {
    body: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'asifakramsk@gmail.com',
                description: 'Email address of the user',
              },
              password: {
                type: 'string',
                example: 'asifakramsk',
                description: 'Password for the user account',
              },
            },
          },
        },
      },
    },
    response: {
      description: '200 Response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              first_name: {
                type: 'string',
                example: 'Asif',
              },
              last_name: {
                type: 'string',
                example: 'Akram',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'asifakramsk@gmail.com',
              },
              status: {
                type: 'string',
                example: 'ACTIVE',
              },
              refresh_token: {
                type: 'string',
                example: 'O4EGz9MR7Oj35ACV1Toi',
              },
              _id: {
                type: 'string',
                example: '6722a54ff3031774ad429414',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T21:29:51.424Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T21:29:51.424Z',
              },
              role: {
                type: 'object',
                properties: {
                  _id: {
                    type: 'string',
                    example: '67226dafb53719217efd205a',
                  },
                  role_name: {
                    type: 'string',
                    example: 'BUSINESS MANAGER',
                  },
                },
              },
              access_token_expiry: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T22:29:51.469Z',
              },
              access_token: {
                type: 'string',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkX3VzZXJfZGV0YWlscyI6eyJmaXJzdF9uYW1lIjoiQXNpZiIsImxhc3RfbmFtZSI6IkFrcmFtIiwiZW1haWwiOiJhc2lmYWtyYW1za0BnbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRyVllqSUY1aUN3bEIuVEVmSEZHVlcuQVFNZ0VqamNNMWI1WFQvOXNiL1VwRm1mWVhVVkpuSyIsInJvbGVfaWQiOiI2NzIyNmRhZmI1MzcxOTIxN2VmZDIwNWEiLCJzdGF0dXMiOiJBQ1RJVkUiLCJmb3JjZV9wYXNzd29yZF9jaGFuZ2UiOmZhbHNlLCJyZWZyZXNoX3Rva2VuIjoiTzRFR3o5TVI3T2ozNUFDVjFUb2kiLCJfaWQiOiI2NzIyYTU0ZmYzMDMxNzc0YWQ0Mjk0MTQiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTMwVDIxOjI5OjUxLjQyNFoiLCJ1cGRhdGVkQXQiOiIyMDI0LTEwLTMwVDIxOjI5OjUxLjQyNFoiLCJfX3YiOjB9LCJpYXQiOjE3MzAzMjM3OTEsImV4cCI6MTczMDMyNzM5MX0.EzrEYrCUXsf2VyMcDuEnNOprh8tNMwylOD8FLwrgY3Q',
              },
            },
          },
        },
      },
    },
  },
  refreshToken: {
    body: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'refresh_token'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'asifakramsk@gmail.com',
                description: 'Email address of the user',
              },
              refresh_token: {
                type: 'string',
                example: 'fzVeNSeadJE8xElcXRxm',
                description: 'Refresh token for the user session',
              },
            },
          },
        },
      },
    },
    response: {
      description: '200 Response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'asifakramsk@gmail.com',
              },
              refresh_token: {
                type: 'string',
                example: 'fzVeNSeadJE8xElcXRxm',
              },
              _id: {
                type: 'string',
                example: '6722a6748d3ce5a086085ee4',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-10-30T21:34:44.945Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-11-02T18:17:22.899Z',
              },
              access_token_expiry: {
                type: 'string',
                format: 'date-time',
                example: '2024-11-02T19:17:23.015Z',
              },
              access_token: {
                type: 'string',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNwb25zZSI6eyJyZWZyZXNoX3Rva2VuIjoiZnpWZU5TZWFkSkU4eEVsY1hSeG0iLCJfaWQiOiI2NzIyYTY3NDhkM2NlNWEwODYwODVlZTQiLCJlbWFpbCI6ImFzaWZha3JhbXNrQGdtYWlsLmNvbSIsImNyZWF0ZWRBdCI6IjIwMjQtMTAtMzBUMjE6MzQ6NDQuOTQ1WiIsInVwZGF0ZWRBdCI6IjIwMjQtMTEtMDJUMTg6MTc6MjIuODk5WiIsImFjY2Vzc190b2tlbl9leHBpcnkiOiIyMDI0LTExLTAyVDE5OjE3OjIzLjAxNVoifSwiaWF0IjoxNzMwNTcxNDQzLCJleHAiOjE3MzA1NzUwNDN9.W1wDXA_Acq2fio_P9lEFWxqz9enf3QII9Z_UAcqwxy8',
              },
            },
          },
        },
      },
    },
  },
};

# CODE OF CONDUCT

## TODO Checklist

- Install eslint and prettier extensions in vs code and use the default settings defined in .vscode

## Folder Structure

- Add all image, assets, json files and other public files to _public_ folder.
- _db-dump_ stores the db backup on migration.
- _config_ directory contains all the env, express, mongoose, socket and swagger configs.
- _controller_ contains all the api controllers.
- _helpers_ contains all the helper functions.
- _migrations_ folder contains all the DB migration files.
- _models_ folder contains all database models.
- _routes_ folder contain the api routes.
- _services_ folder contain all 3rd party service like email, payment gateway etc.
- _utils_ folder contain all the constants and swagger details.

```
.
├── ...
│    ├── config
│    │   ├── index
│    │   ├── env
│    │   ├── express
│    │   ├── mongoose
│    │   ├── socket
│    │   ├── swagger
│    ├── controllers
├── scr  ├── index
│    │   ├── baseController
│    ├── helpers
│    ├── middlewares
│    ├── migrations
│    ├── models
│    ├── routes
│    │   ├── v1
│    ├── services
│    ├── utils
│    │   ├── constants
│    │   ├── swaggerConfigs
│    ├── index.js
│    ├── migrate.js
├── public
├── db-dump
└── ...
```

## Contributing

Pull requests (PRs) are welcome.

- Create a branch with your name from dev branch.
- Do changes in that branch.
- Push changes to your branch and create PR to staging branch.
- Get PR reviewed for sanity check and merge it to staging.
- Then finally merge all changes from staging to main to deploy in prod.

## License

[MIT](https://choosealicense.com/licenses/mit/)

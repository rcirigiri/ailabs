# Project README

## Introduction

This Node.js API project is designed to provide a robust backend service with various features including authentication, logging, and CRUD operations. The following sections outline the steps for contributing to the project and migrating database/schema changes.

## Default Superadmin Credentials

- **Username:** `admin`
- **Password:** `admin`

Please ensure to change these credentials in a production environment for security purposes.

## Pull Request (PR) Workflow

Follow these steps to create and merge a PR to the main branch:

1. **Sync with the Latest Code**

   - Run `git pull origin main` to fetch and merge the latest changes from the main branch.

2. **Develop Your Feature/Fix**

   - Work on your code changes in a feature or bugfix branch. Ensure your changes align with the project's goals and coding standards.

3. **Commit Your Changes**

   - Use `git commit -m "Your descriptive commit message"` to commit your changes. Ensure your commit messages are clear and concise.

4. **Push Your Changes**

   - Push your branch to the remote repository using `git push origin your-branch-name`.

5. **Create a Pull Request**

   - Navigate to your repository on GitHub, and create a PR from your branch to the main branch. Provide a detailed description of your changes and any relevant context.

6. **Merge the PR (Reviewer)**
   - Once the PR is reviewed and approved, it will be merged into the main branch by a designated reviewer.

## Database/Schema Migration

Follow these steps to implement and manage database/schema migrations:

1. **Write Migration Code**

   - Create a migration file in the `src/migrations` directory. Follow the naming convention: `1-add-default-roles.js`.

2. **Backup the Database**

   - Ensure you take a complete backup of the database to prevent data loss.

3. **Run the Migration**

   - Execute the migration with the command `npm run migrate 1-add-default-roles.js`.

4. **Rollback if Necessary**

   - If you encounter issues during migration, use `npm run rollback 1-add-default-roles.js` to revert the changes.

5. **Develop with Care**
   - Ensure the `migrate` and `rollback` methods in your migration file are correctly implemented to handle schema changes safely and effectively.

## Swagger Doc Guidelines

Follow these steps to create swagger doc for each new endpoint:

- Add tag and description if you are creating a new group type. Add tag details in `src/utils/swaggerConfigs/index.js` file under `SWAGGER_TAGS`.

- Create new file for that tag i.e `auth.js` and import it inside `SCHEMA_EXAMPLES` in the same file `src/utils/swaggerConfigs/index.js`.

- Create schema inside the file created `auth.js` in the following format :

```
registerBusiness:{
    body: {},
    params: {},
    response: {}
}
```

- Add the openai comment to your router and import this schema components

**NOTE :** Refer to the `/health-check` api or any auth api for the openai comment format.

## Contribution Guidelines

For any contributions, please adhere to the project's coding standards and ensure thorough testing of your features or fixes. For any questions, refer to this README or contact the project maintainers.

## License

This project is licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

---

Please make any additional changes that are necessary or let me know if there's anything else you'd like to include!

#### Other reference links

[Swagger Config doc](https://swagger.io/docs/specification/media-types/)

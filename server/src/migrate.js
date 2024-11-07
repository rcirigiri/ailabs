const {env, mongoose} = require('./config');
const {
  constants: {LOG_LEVELS},
} = require('./utils');
const path = require('path');
const {exec} = require('child_process');
const fs = require('fs');

/**
 * Overwrite default console log
 * So that error and server log can be handled in structured way
 */
var origLog = console.log;
console.log = (...args) => {
  let level = LOG_LEVELS.DEBUG;
  if (Object.keys(LOG_LEVELS).includes(args[args.length - 1])) {
    level = args[args.length - 1];
    args.pop();
  }
  origLog(new Date(), ' ', level, '\t : ', ...args);
};

/**
 * Migrate the DB schema / changes
 */
function migrateDatabase() {
  mongoose
    .connect()
    .then(async () => {
      try {
        const action = process.argv[2];
        const fileName = process.argv[3];
        if (!fileName) {
          console.log(
            'Please provide a migration file name as an argument.',
            LOG_LEVELS.ERROR,
          );
          process.exit(1);
        }
        const filePath = path.resolve(__dirname, 'migrations/' + fileName);
        const module = require(filePath);
        if (action == 'migrate') {
          console.log('Migrating ....', LOG_LEVELS.INFO);
          await module.migrate();
        } else if (action == 'rollback') {
          console.log('Rolling back ....', LOG_LEVELS.INFO);
          await module.rollback();
        }
        console.log('Complete ....', LOG_LEVELS.INFO);
      } catch (e) {
        console.log(e, LOG_LEVELS.FATAL);
      }
    })
    .catch(e => {
      console.log('Invalid database connection...!', LOG_LEVELS.ERROR);
    })
    .finally(() => {
      console.log('Exiting process...');
      process.exit(0); // Exit the process
    });
}

/**
 * Create directory for backup if not exists
 * @param {*} basePath
 * @returns path
 */
function createDateDirectory(basePath) {
  // Get the current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split('T')[0];
  const dateDirPath = path.join(basePath, currentDate);

  // Check if the directory exists
  if (!fs.existsSync(dateDirPath)) {
    fs.mkdirSync(dateDirPath, {recursive: true});
    console.log(`Created directory: ${dateDirPath}`);
  } else {
    console.log(`Directory already exists: ${dateDirPath}`);
  }

  return dateDirPath;
}

/**
 * Backup DB before migrating
 * Ignore if it is DEV
 * @param {*} callback
 */
function backupDatabaseAndMigrateDB(callback) {
  const action = process.argv[2];
  if (env.env == 'DEV' || action == 'rollback') return callback();

  const dumpBasePath = path.join(__dirname, '../db-dump');
  const dumpPath = createDateDirectory(dumpBasePath);
  const dbName = env.db_name;

  const command = `mongodump --db ${dbName} --out ${dumpPath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during database dump: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Standard error: ${stderr}`);
      return;
    }
    console.log(`Database dump complete. Output: ${stdout}`);
    console.log(`Database dumped to: ${dumpPath}`);
    callback();
  });
}

backupDatabaseAndMigrateDB(migrateDatabase);

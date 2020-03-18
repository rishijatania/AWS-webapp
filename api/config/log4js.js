const log4js = require('log4js');
const CONFIG = require('./config');
var appRoot = require('app-root-path');
log4js.configure({
    appenders: {
        consoleAppender: {
            type: 'console'
        },
        fileAppender: {
            type: 'file',
            filename: `/home/ubuntu/app.log`,
            maxLogSize: 10485760,
            backups: 1,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: ['consoleAppender', 'fileAppender'],
            level: CONFIG.app === 'prod' ? 'info' : 'debug'
        }
    }
});

const logger = log4js.getLogger();
logger.debug("App started");
module.exports.logger = logger;
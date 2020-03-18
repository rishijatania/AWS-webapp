const log4js = require('log4js');
const CONFIG = require('./config');
var appRoot = require('app-root-path');
log4js.configure({
    appenders: {
        out: {
            type: 'stdout'
        },
        app: {
            type: 'file',
            filename: '/home/ubuntu/app.log',
            maxLogSize: 10485760,
            backups: 1,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: ['out', 'app'],
            level: 'debug'
        }
    }
});

const logger = log4js.getLogger();
logger.info("App started");
module.exports.logger = logger;
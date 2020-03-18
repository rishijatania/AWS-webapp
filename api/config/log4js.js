const log4js = require('log4js');
const logger = log4js.getLogger();

log4js.configure({
    appenders: {
        out: {
            type: 'stdout'
        },
        app: {
            type: 'file',
            filename: '/home/ubuntu/webapp-log4s.log',
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

logger.debug('Logger Level On : ');
module.exports = logger;
var appRoot = require('app-root-path');

const appSettings = {
	log4js: {
        LogConfig: {
            appenders: {
				out: {
					type: 'stdout'
				},
				app: {
					type: 'file',
					filename: `${appRoot}/app.log`,
					maxLogSize: 10485760,
					backups: 1,
					compress: true,
					
				}
			},
			categories: {
				default: {
					appenders: ['out', 'app'],
					level: 'debug'
				}
			}
        }
    }
}
module.exports = appSettings;
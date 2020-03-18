const express = require('express');
const logger1 = require('morgan');
const bodyParser = require('body-parser');
const pe = require('parse-error');
const cors = require('cors');
const fs = require('fs');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const CONFIG = require('./config/config');
const { logger } = require('./config/log4js');
/*
Module:multer
multer is middleware used to handle multipart form data
*/
logger.info("app Started");
let s3 = new aws.S3();
aws.config.update({ region: CONFIG.aws_region });
const bucket = CONFIG.s3_bucket;

const multer = require('multer');

let upload;
if (CONFIG.app === 'prod') {
	let storage = multer.memoryStorage();
	upload = multer({
		storage: storage,
		fileFilter: function (req, file, cb) {
			if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'application/pdf')
				return cb(null, true);
			else {
				let err = { error: { msg: "Invalid file type. Only jpg, jpeg, png and pdf files are allowed." } };
				return cb(err, false);
			}
		}
	}).single('billAttachment');
} else {
	let storage = multer.diskStorage({
		destination: (req, file, cb) => {
			console.log(req.params.id);
			const dir = '.' + CONFIG.file_upload_path + req.params.id;
			fs.exists(dir, exist => {
				if (!exist) {
					return fs.mkdir(dir, error => cb(error, dir))
				}
				return cb(null, dir);
			})
		},
		filename: (req, file, cb) => {
			cb(null, file.originalname);
		}
	});
	upload = multer({
		storage: storage, fileFilter: function (req, file, cb) {
			console.log(file);
			if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'application/pdf')
				return cb(null, true);
			else {
				let err = { error: { msg: "Invalid file type. Only jpg, jpeg, png and pdf files are allowed." } };
				return cb(err, false);
			}
		}
	}).single('billAttachment');
}

module.exports.upload = upload;

const s3_upload = async function (req) {
	if (CONFIG.app === 'prod') {
		const file = req.file;
		console.log("in s3 upload");
		let params = {
			Bucket: bucket,
			Key: req.params.id + "/" + file.originalname,
			Body: file.buffer,
		};
		console.log("in s3 just before upload");
		let data;
		try {
			data = await s3.upload(params).promise();
		} catch (err) {
			return err;
		}
		req.file.path = data.Location;
	}
}

module.exports.s3_upload = s3_upload;

const s3_delete = async function (req, res, file) {
	console.log(req.params.id + '/' + req.params.fid);
	var params = {
		Bucket: bucket,
		Key: req.params.id + '/' + file.file_name
	};
	try {
		let data = await s3.deleteObject(params).promise();
	} catch (err) {
		return err;
	}
}
module.exports.s3_delete = s3_delete;

const v1 = require('./routes/v1');
const app = express();

app.use(logger1('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Connect to Database and Load models
const models = require("./models");
models.sequelize.authenticate().then(() => {
	console.log('Connected to SQL database:', CONFIG.db_name);
})
	.catch(err => {
		console.error('Unable to connect to SQL database:', CONFIG.db_name);
	});
if (CONFIG.app === 'dev') {
	// models.sequelize.sync();
	models.sequelize.sync({ alter: true });
}
if (CONFIG.app === 'prod') {
	models.sequelize.sync({ alter: true });
}
//CORS — SO other websites can make requests to this server
app.use(cors());

//Setup Routes and handle errors
app.use('/v1', v1);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
// 	var err = new Error('Not Found');
// 	err.status = 400;
// 	// next(err);
// 	res.json({err});
// });

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = CONFIG.app === 'dev' || 'prod' ? err : {};
	// render the error page
	res.status(err.status || 400);
	res.send(err);
});

module.exports = app;

//Set Up Promise Handler in app.js
process.on('unhandledRejection', error => {
	console.error('Uncaught Error', pe(error));
});
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const pe = require('parse-error');
const cors = require('cors');
const fs = require('fs');

/*
Module:multer
multer is middleware used to handle multipart form data
*/
const multer = require('multer');
// // const multerS3 = require('multer-s3');
var upload;
// // if (CONFIG.app === 'production') {
//     // upload = multer({
//     //     storage: multerS3({
//     //         s3: s3,
//     //         bucket: bucket,
//     //         acl: 'private',
//     //         contentType: multerS3.AUTO_CONTENT_TYPE,
//     //         key: (req, file, cb) => {
//     //             cb(null, file.originalname);
//     //         }
//     //     }),
//     //     fileFilter: function (req, file, cb) {
//     //         if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg')
//     //             return cb(null, true);
//     //         else
//     //             return cb(new Error('Unsupported File Format'), false);
//     //     }
//     // });
// // } else {
    let storage = multer.diskStorage({
        destination: (req, file, cb) => {
			console.log(req.params.id);
			const dir = '.'+CONFIG.file_upload_path + req.params.id;
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
            if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype=='application/pdf')
                return cb(null, true);
			else{
				let err={error:{msg: "Invalid file type. Only jpg, jpeg, png and pdf files are allowed."}};
				return cb(err,false);
			}
        }
    }).single('billAttachment');
// }

module.exports.upload = upload;

const v1 = require('./routes/v1');
const app = express();

const CONFIG = require('./config/config');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Connect to Database and Load models
const models = require("./models");
models.sequelize.authenticate().then(() => {
        console.log('Connected to SQL database:', CONFIG.db_name);
    })
    .catch(err => {
        console.error('Unable to connect to SQL database:',CONFIG.db_name);
    });
if(CONFIG.app==='dev'){
    models.sequelize.sync();
}

//CORS — SO other websites can make requests to this server
app.use(cors());

//Setup Routes and handle errors
app.use('/v1', v1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 400;
    // next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = CONFIG.app === 'dev' ? err : {};
    // render the error page
    res.status(err.status || 400);
    res.send(err);
});

module.exports = app;

//Set Up Promise Handler in app.js
process.on('unhandledRejection', error => {
    console.error('Uncaught Error', pe(error));
});
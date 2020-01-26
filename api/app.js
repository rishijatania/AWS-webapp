const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const pe = require('parse-error');
const cors = require('cors');

const v1 = require('./routes/v1');
const app = express();

const CONFIG = require('./config/config');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Passport
// app.use(passport.initialize());

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
    // models.sequelize.sync({ force: true });
}

//CORS — SO other websites can make requests to this server
app.use(cors());

//Setup Routes and handle errors
app.use('/v1', v1);

//Check for code to be returned
// app.use('/', function(req, res){
//     res.statusCode = 200;//send the appropriate status code
//     res.json({status:"success", message:"Parcel Pending API", data:{}})
// });

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
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 400);
    res.send('error');
});

module.exports = app;

//Set Up Promise Handler in app.js
process.on('unhandledRejection', error => {
    console.error('Uncaught Error', pe(error));
});
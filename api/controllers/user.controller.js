const { User }          = require('../models');
const authService       = require('../services/auth');
const { to, ReE, ReS }  = require('../services/util');
const passwordValidator = require('password-validator');
const validator = require('validator');
const { logger, metrics } = require("../app");
// const SDC = require('statsd-client');
// const statsd = new SDC({host: 'localhost', port: 8125});

const create = async function(req, res){
    const userInfo = req.body;
	logger.info("User :: Create");
	metrics.increment("[COUNTER]:[POST]:[USER]");
    if(!userInfo.email_address){
		logger.error("User :: Create :: Email Address is missing");
        return ReE(res, {error:{ msg: 'Email Address is missing'}} ,400);
    }else if(!userInfo.password){
		logger.error("User :: Create :: Password is missing");
        return ReE(res, {error:{ msg: 'Password is missing'}} ,400);
    }else{
        let err, user;

        delete userInfo.account_updated;
        delete userInfo.account_created;
		delete userInfo.id;

		// Create a schema
		var schema = new passwordValidator();
		// Add properties to it
		schema
			.is().min(8)                                    // Minimum length 8
			.is().max(100)                                  // Maximum length 100
			.has().uppercase()                              // Must have uppercase letters
			.has().lowercase()                              // Must have lowercase letters
			.has().digits()                                 // Must have digits
			.has().not().spaces()                           // Should not have spaces
			.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

		if(!validator.isEmail(userInfo.email_address)){
			logger.error("User :: Create :: Email address is not Valid");
			return  ReE(res, {error:{msg: 'Email address is not Valid'}}, 400);
		}
		if(!schema.validate(userInfo.password)) {
			logger.error("User :: Create :: Password is weak");
			return ReE(res,{error:{msg: 'Password is weak'}}, 400);
		}
		[err, success] = await searchByEmail(userInfo);
		if(!success || err) {
			[err, user] = await to(User.create(userInfo));

			if (err) {
				logger.error("User :: Create :: Failed");
				return ReE(res, {error:{msg: err.message}} , 400);
			}
			//Remove password from response
			user.password = undefined;
			logger.info("User :: Create :: Successfull");
			return ReS(res,user.toWeb(), 201);
		}
		else if(success) {
			logger.error("User :: Create :: User already exists");
			return ReE(res, {error:{msg: 'User already exists'}} , 400);
		}
		else{
			logger.error("User :: Create :: Database Operation Error");
			return ReE(res, {error:{msg: 'Database Operation Error'}} , 400);
		}
    }
};
module.exports.create = create;

const get = async function(req, res){
	let err, user;
	logger.info("User :: Get");
    console.log(req.email_address);
    console.log("get function");
	[err, user] = await searchByEmail(req);
	metrics.increment("[COUNTER]:[GET]:[USER]");
    if(err){
		logger.error("User :: Get :: User not found");
        return ReE(res, {error:{ msg: 'User not found'}} , 400);
    }
	user.password=undefined;
	logger.debug("User :: Get :: "+ user.toWeb());
	logger.info("User :: Get :: Successfull");
    return ReS(res,user.toWeb(), 200);

};
module.exports.get = get;

const update = async function(req, res){
    let data;
    data = req.body;
	logger.info("User :: Update");
	metrics.increment("[COUNTER]:[PUT]:[USER]");
    // Create a schema
    var schema = new passwordValidator();
    // Add properties to it
    schema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits()                                 // Must have digits
        .has().not().spaces()                           // Should not have spaces
        .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

    //Add Validation for other fields also not should be able to change for other user
    if(data.email_address!==req.email_address){
		logger.error("User :: Update :: Please enter correct email address for update");
        return ReE(res, {error:{ msg: 'Please enter correct email address for update'}}, 400);
    }
    if(!schema.validate(data.password)){
		logger.error("User :: Update :: Password is weak");
		return ReE(res, {error:{ msg: 'Password is weak'}}, 400);
	}
	data.account_updated=undefined;
	data.account_created=undefined;
	data.id=undefined;
	let err, user;
	[err, user] = await searchByEmail(data); //await to(User.findOne({ where: { email_address : data.email_address } }));

	if(user){
		user.set(data);
		[err, user] = await to(user.save());
	}

	if(err){
		if(err.message==='Validation error') err = {error:{ msg: 'The email address is already in use'}};
		logger.error("User :: Update :: The email address is already in use");
		return ReE(res, err, 400);
	}
	logger.debug("User :: Update :: "+ user.toWeb());
	logger.info("User :: Update :: Successfull");
	return ReS(res,{msg: 'Updated User: '+user.email_address}, 204); //{message :'Updated User: '+user.email_address}
    
};
module.exports.update = update;

const searchByEmail = async function (user){
    return await to(User.findOne({ where: { email_address : user.email_address } }));

};
module.exports.searchByEmail = searchByEmail;
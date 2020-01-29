const { User }          = require('../models');
const authService       = require('../services/auth');
const { to, ReE, ReS }  = require('../services/util');
const passwordValidator = require('password-validator');
const validator = require('validator');

const create = async function(req, res){
    const userInfo = req.body;

    if(!userInfo.email_address){
        return ReE(res, {error:{ msg: 'Email Address is missing'}} ,400);
    }else if(!userInfo.password){
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
			return  ReE(res, {error:{msg: 'Email address is not Valid'}}, 400);
		}
		if(!schema.validate(userInfo.password)) {
			return ReE(res,{error:{msg: 'Password is weak'}}, 400);
		}
		[err, success] = await searchByEmail(userInfo);
		if(!success || err) {
			[err, user] = await to(User.create(userInfo));

			if (err) {
				return ReE(res, {error:{msg: err.message}} , 400);
			}
			//Remove password from response
			user.password = undefined;
			return ReS(res,user.toWeb(), 201);
		}
		else if(success) {
			return ReE(res, {error:{msg: 'User already exists'}} , 400);
		}
		else{
			return ReE(res, {error:{msg: 'Database Operation Error'}} , 400);
		}
    }
};
module.exports.create = create;

const get = async function(req, res){
    let err, user;
    console.log(req.email_address);
    console.log("get function");
    [err, user] = await searchByEmail(req);
    if(err){
        return ReE(res, {error:{ msg: 'User not found'}} , 400);
    }
    user.password=undefined;
    return ReS(res,user.toWeb(), 200);

};
module.exports.get = get;

const update = async function(req, res){
    let data;
    data = req.body;

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
        return ReE(res, {error:{ msg: 'Please enter correct email address for update'}}, 400);
    }
    if(!schema.validate(data.password)){
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
		return ReE(res, err, 400);
	}
	return ReS(res,{msg: 'Updated User: '+user.email_address}, 204); //{message :'Updated User: '+user.email_address}
    
};
module.exports.update = update;

const searchByEmail = async function (user){
    return await to(User.findOne({ where: { email_address : user.email_address } }));

};
module.exports.searchByEmail = searchByEmail;
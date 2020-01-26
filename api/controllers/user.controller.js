const { User }          = require('../models');
const authService       = require('../services/auth');
const { to, ReE, ReS }  = require('../services/util');
const passwordValidator = require('password-validator');
const validator = require('validator');

const create = async function(req, res){
    const body = req.body;

    if(!body.email_address){
        return ReE(res, "",400);
    } else if(!body.password){
        return ReE(res, "",400);
    }else{
        let err, user;

        delete body.account_updated;
        delete body.account_created;
        delete body.id;

        [err, user] = await to(authService.createUser(body));

        if(user) return ReS(res,user.toWeb(), 201);
        return ReE(res, "" , 400);

    }
};
module.exports.create = create;

const get = async function(req, res){
    let err, user;
    console.log(req.email_address);
    console.log("get function");
    [err, user] = await searchByEmail(req);
    if(err){
        return ReE(res, "", 400);
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
    if(data.email_address!==req.email_address && !schema.validate(data.password)){
        return ReE(res, "", 400);
    }
    else {
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
            // if(err.message==='Validation error') err = 'The email address is already in use';
            return ReE(res,"", 400);
        }
        return ReS(res,{}, 204); //{message :'Updated User: '+user.email_address}
    }
};
module.exports.update = update;

const searchByEmail = async function (user){
    return await to(User.findOne({ where: { email_address : user.email_address } }));

};
module.exports.searchByEmail = searchByEmail;
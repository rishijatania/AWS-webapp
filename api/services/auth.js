const { User } = require('../models');
const validator = require('validator');
const { to, TE, ReE } = require('../services/util');
const passwordValidator = require('password-validator');

const createUser = async (userInfo) => {
    let err,user;

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

    if(validator.isEmail(userInfo.email_address) && schema.validate(userInfo.password)){
        [err, success] = await to(User.findOne({where: {email_address: userInfo.email_address}}));
        if(!success || err) {
            [err, user] = await to(User.create(userInfo));

            if (err) return err;

            //Remove password from response
            user.password = undefined;
            return user;
        }
        else{
            return undefined;
        }
    }else{
        return err;
    }
};
module.exports.createUser = createUser;

const basicAuth = async function basicAuth(req, res, next) {

    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({message: 'Missing Authorization Header'});
    }

    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    let err, user, success;
    [err, user] = await to(User.findOne({where: {email_address: username}}));

    if (err) return next(err, false);
    if (!user) return next(null, false);
    console.log("Before Compare");
    [err, success] = await to(user.comparePassword(password));
    if (err) return ReE(res, "" , 400);
    if (success) {
        console.log("On success for compare");
        console.log(user.email_address);
        // attach user to request object

        req.email_address = user.email_address;
        console.log(req.email_address);
        return next(null, user);
    }
    console.log("On error for compare");
    return ReE(res, "" , 400);
};

module.exports.basicAuth = basicAuth;
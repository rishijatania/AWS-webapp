const { User } = require('../models');
const validator = require('validator');
const { to, TE, ReE,startTimer } = require('../services/util');

const basicAuth = async function basicAuth(req, res, next) {
	startTimer();
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({error:{msg: 'Missing Authorization Header'}});
    }

    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    let err, user, success;
    [err, user] = await to(User.findOne({where: {email_address: username}}));

    if (err) { 
		return ReE(res, {error:{msg: 'Unauthorized : Authentication error'}} , 401);
	}
    if (!user) {
		return ReE(res, {error:{msg: 'Unauthorized : Authentication error'}} , 401);
	}
    [err, success] = await to(user.comparePassword(password));
    if (err) return ReE(res,{error:{msg: 'Unauthorized : Invalid password'}}  , 401);
    if (success) {
        // attach user to request object
		req.email_address = user.email_address;
        return next();
    }
    return ReE(res, {error:{msg: 'Unauthorized : Authentication error'}} , 401);
};

module.exports.basicAuth = basicAuth;
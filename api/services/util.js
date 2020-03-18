const {to} = require('await-to-js');
const pe = require('parse-error');
var startDate,endDate,seconds;
const SDC = require('statsd-client');
const statsd = new SDC({host: 'localhost', port: 8125});

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if(err) return [pe(err)];

    return [null, res];
};

module.exports.ReE = ReE = function(res, err, code){ // Error Web Response
    if(typeof err == 'object' && typeof err.message != 'undefined'){
        err = err.message;
    }

    if(typeof code !== 'undefined') res.statusCode = code;
    return res.json(err);
};

module.exports.ReS = function(res, data, code, api){ // Success Web Response
    let send_data;// = {success:true};

    if(typeof data == 'object'){
        send_data = Object.assign(data, send_data);//merge the objects
    }

    if(typeof code !== 'undefined') res.statusCode = code;
	if(api){
		endTimer(api);
	}
    return res.json(send_data)
};

module.exports.TE = TE = function(err_message, log){ // TE stands for Throw Error
    if(log === true){
        console.error(err_message);
    }

    throw new Error(err_message);
};

module.exports.startTimer = function(){ // TE stands for Throw Error
	startDate=new Date();
};

function endTimer (api){
	endDate = new Date();
 	seconds = (endDate.getTime() - startDate.getTime());

	statsd.timing(api, seconds);
}




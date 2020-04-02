const {to} = require('await-to-js');
const pe = require('parse-error');
const { logger, aws} = require("../app");
const SDC = require('statsd-client');
const statsd = new SDC({host: 'localhost', port: 8125});
const CONFIG = require('../config/config');
// Create an SQS service object
const sqs = new aws.SQS();
const sns = new aws.SNS();

var startDate,endDate,seconds;

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

module.exports.endTimer = endTimer;

const sendMessageToSQS= async function sendMessageToSQS(SQSMessage) {
	let sqsData = {
        MessageBody: JSON.stringify(SQSMessage),
        QueueUrl: CONFIG.sqs_queue_name
    };

    // Send the order data to the SQS queue
	let data,err;
	[err,data] = await to(sqs.sendMessage(sqsData).promise());

	if(err) {
		logger.error(`SQS SEND MESSAGE | ERROR: ${JSON.stringify(err)}`);
		return 
		//[err,undefined];
	}
	logger.info(`SQS SEND MESSAGE | SUCCESS: ${data.MessageId}`);
	// return [undefined,data];
}

module.exports.sendMessageToSQS = sendMessageToSQS;

const snsPublish = async function(message) {
	let params = {
		Message: message, /* required */
  		TopicArn: CONFIG.sns_topic_arn
	}
	logger.debug(params);
	// Send the order data to SNS
	let data,err;
	[err,data] = await to(sns.publish(params).promise());

	if(err) {
        return logger.error(`SNS PUBLISH MESSAGE | ERROR: ${JSON.stringify(err)}`);
	}
    logger.info(`SNS PUBLISH MESSAGE | SUCCESS: ${data.MessageId}`); 

}
module.exports.snsPublish = snsPublish;
const {to} = require('await-to-js');
const { Bill } = require('../models');
const pe = require('parse-error');
const { logger, aws} = require("../app");
const SDC = require('statsd-client');
const statsd = new SDC({host: 'localhost', port: 8125});
const CONFIG = require('../config/config');
// Create an SQS service object
const sqs = new aws.SQS();
const sns = new aws.SNS();
const { Op } = require("sequelize");
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

	let data = await getBillsDue(message);
	
	let params = {
		Message: data, /* required */
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

const getBillsDue = async function (message){

	logger.info('Bill :: GetBillsDue');
	statsd.increment("GET BILLS DUE");
	let fromDate = new Date();
	let noOfDays = message.noOfDays;
	let toDate = new Date();
	toDate.setDate(toDate.getDate() + Number(noOfDays));
	logger.info(`Bill :: GetBillsDue :: From Date: ${fromDate} To Date: ${toDate} For User: ${message.user.email_address}`);

	[err, bill] = await to(Bill.findAll({
		where: { 
			owner_id: message.user.id,
			due_date : {
				[Op.between]: [fromDate,toDate]
			}
		 }, 
		include: [{
			model: File,
			as: 'attachment' // specifies how we want to be able to access our joined rows on the returned data
		}]
	}));
	
	if (err || !bill) {
		logger.error('Bill :: GetBillsDue ::' + err.message);
		return
	}
	let bills = [];
	bill.forEach((item) => {
		item = item.toWeb();
		if (item.attachment === null) {
			item['attachment'] = {};
		} else {
			item.attachment.bill_id = undefined;
			item.attachment.file_size = undefined;
			item.attachment.file_type = undefined;
			item.attachment.encoding = undefined;
			item.attachment.checksum = undefined;
		}
		bills.push(item);
	});
	message.billsDue=[];
	bills.forEach((item) => {
		let billUrl = `http://${CONFIG.domain_name}/v1/bill/${item.id}`;
		message.billsDue.push(billUrl);
	});
	logger.debug('Bill :: GetBillsDue :: MessagePayload ' + message);
	return message;
}

module.exports.getBillsDue = getBillsDue;
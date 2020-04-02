const { User, Bill, File } = require('../models');
const authService = require('../services/auth');
const { to, ReE, ReS, sendMessageToSQS, startTimer, endTimer } = require('../services/util');
const { searchByEmail } = require('./user.controller');
const CONFIG = require('../config/config');
const path = require('path');
const fs = require('fs');
const { s3_delete, logger} = require("../app");
const SDC = require('statsd-client');
const statsd = new SDC({host: 'localhost', port: 8125});
const util = require('../services/util');
const { Op } = require("sequelize");

const createBill = async function (req, res) {
	const body = req.body;

	let err, user, bill;
	logger.info("Bill :: Create");
	statsd.increment("POST BILL USER");
	//Round of to 2 decimal
	body.amount_due = body.amount_due.toFixed(2);

	if (Date.parse(body.due_date) < Date.parse(body.bill_date)) {
		logger.error("Bill :: Create :: Due Date should be after the Bill date");
		return ReE(res, { error: { msg: "Due Date should be after the Bill date" } }, 400);
	}

	body.categories = body.categories.filter(onlyUnique);

	[err, user] = await searchByEmail(req);
	if (err) {
		logger.error("Bill :: Create :: User Not Found");
		return ReE(res, { error: { msg: err.message } }, 400);
	}

	body.owner_id = user.id;
	startTimer();
	[err, bill] = await to(Bill.create(body));
	endTimer('SQL CREATE BILL')
	if (err || !bill) {
		logger.error('Bill :: Create :: Bill` creation failed');
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	bill = bill.toWeb();
	bill.attachment = {};
	logger.debug(bill);
	logger.info('Bill :: Create :: Successfull')
	return ReS(res, bill, 201,'CREATE BILL');

};
module.exports.createBill = createBill;

const getBillsByUser = async function (req, res) {
	const body = req.body;
	let err, user, bill;
	logger.info('Bill :: GetBillByUser');
	statsd.increment("GET BILL USER");
	[err, user] = await searchByEmail(req);
	if (err) {
		logger.error("Bill :: GetBillByUser :: User Not Found");
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	startTimer();
	[err, bill] = await to(Bill.findAll({
		where: { owner_id: user.id }, include: [{
			model: File,
			as: 'attachment' // specifies how we want to be able to access our joined rows on the returned data
		}]
	}));
	endTimer('SQL GET BILL BY USER')
	if (err || !bill) {
		logger.error('Bill :: GetBillByUser ::' + err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
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
	logger.debug(bills);
	logger.info('Bill :: GetBillByUser :: Successfull')
	return ReS(res, bills, 200,'GET BILL BY USER');

};
module.exports.getBillsByUser = getBillsByUser;

const getBillById = async function (req, res) {
	let err, user, bill;
	logger.info("Bill :: GetBillByID");
	statsd.increment("GET BILL ID");
	startTimer();
	[err, bill] = await searchBillById(req.params.id);
	endTimer('SQL GET BILL BY ID')
	if (!bill || err) {
		logger.error("Bill :: GetBillByID :: Bill Not Found");
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}

	[err, user] = await searchByEmail(req);
	if (err) {
		logger.error("Bill :: GetBillByID :: User Not Found");
		console.log(err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	if (user.id !== bill.owner_id) {
		logger.error("Bill :: GetBillByID :: Unauthorized : Authentication error");
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}
	bill = bill.toWeb();
	if (bill.attachment === null) {
		bill['attachment'] = {};
	} else {
		bill.attachment.bill_id = undefined;
		bill.attachment.file_size = undefined;
		bill.attachment.file_type = undefined;
		bill.attachment.encoding = undefined;
		bill.attachment.checksum = undefined;
	}
	logger.debug(bill);
	logger.info('Bill :: GetBillByID :: Successfull')
	return ReS(res, bill, 200,'GET BILL BY ID');

};
module.exports.getBillById = getBillById;

const searchBillById = async function (id) {
	console.log(id)
	return await to(Bill.findOne({ where: { id: id }, include: 'attachment' }));
};

module.exports.searchBillById = searchBillById;

const deleteBillById = async function (req, res) {
	const body = req.body;
	let err, user, bill, success;
	logger.info('Bill :: DeleteBillById');
	statsd.increment("DELETE BILL ID");
	logger.debug('ID:'+req.params.id);

	[err, bill] = await searchBillById(req.params.id);
	if (err || !bill) {
		logger.error("Bill :: DeleteBillById :: Bill Not Found");
		return ReE(res, { error: { msg: "Bill Not Found" } }, 404);
	}

	[err, user] = await searchByEmail(req);
	logger.debug("user id" + user.id);
	if (err) {
		logger.error("Bill :: DeleteBillById :: User Not Found");
		return ReE(res, { error: { msg: 'Database Operation Error' } }, 400);
	}

	if (user.id !== bill.owner_id) {
		logger.error("Bill :: DeleteBillById :: Unauthorized Authentication error");
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}
	startTimer();
	[err, success] = await to(Bill.destroy({ where: { id: req.params.id, owner_id: user.id } }));
	endTimer('SQL DELETE BILL')
	if (err || success === 0) {
		logger.error("Bill :: DeleteBillById :: Database Operation Error");
		return ReE(res, { error: { msg: 'Database Operation Error' } }, 500);
	}
	if (bill.attachment !== null) {
		if (CONFIG.app === 'prod') {
			err = await s3_delete(req, res, bill.attachment);
			logger.debug("Bill :: DeleteBillById :: File Name : " + bill.attachment);
			if (err) {
				logger.error("Bill :: DeleteBillById :: S3 unable to Delete");
				return ReE(res, err, 400);
			}
		} else {
			err = deleteFileFromDisk(bill);
			if (err) {
				logger.error("Bill :: DeleteBillById :: Local Unable to Delete");
				return ReE(res, err, 500);
			}
		}
	}
	logger.info('Bill :: DeleteBillById :: Successfull')
	return ReS(res, {}, 204,'DELETE BILL');
};

module.exports.deleteBillById = deleteBillById;

const updateBillById = async function (req, res) {
	const body = req.body;
	logger.info('Bill :: UpdateBillById');
	statsd.increment("PUT BILL ID");
	let err, user, bill, success, msg;
	console.log(req.params.id);
	[err, bill] = await searchBillById(req.params.id);
	if (!bill || err) {
		return ReE(res, { error: { msg: "Bill Not Found" } }, 404);
	}

	[err, user] = await searchByEmail(req);

	if (!user || err || user.id !== bill.owner_id) {
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401)
	}

	//Round of to 2 decimal
	body.amount_due = body.amount_due.toFixed(2);

	if (Date.parse(body.due_date) < Date.parse(body.bill_date)) {
		return ReE(res, { error: { msg: "Due Date should be after the Bill date" } }, 400);
	}

	body.categories = body.categories.filter(onlyUnique);

	bill.vendor = body.vendor;
	bill.bill_date = body.bill_date;
	bill.due_date = body.due_date;
	bill.amount_due = body.amount_due;
	bill.paymentStatus = body.paymentStatus;
	bill.categories = body.categories;
	startTimer();
	[err, success] = await to(bill.save());
	endTimer('SQL UPDATE BILL')
	if (err || !success) {
		console.log("errpr " + err.message);
		msg = err.message.includes('Validation error') ? err.message : 'Database Operation Error';
		return ReE(res, { error: { msg: msg } }, 400);
	}

	success = success.toWeb();
	if (success.attachment === null) {
		success['attachment'] = {};
	} else {
		success.attachment.bill_id = undefined;
		success.attachment.file_size = undefined;
		success.attachment.file_type = undefined;
		success.attachment.encoding = undefined;
		success.attachment.checksum = undefined;
	}

	return ReS(res, success, 200,'UPDATE BILL');
};
module.exports.updateBillById = updateBillById;

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

const deleteFileFromDisk = function (bill) {
	let deletefrom = path.join(process.cwd(), '/', bill.attachment.url);
	fs.unlink(deletefrom, (err) => {
		if (err) {
			return { error: { msg: 'File Operation Error' } };
		}
	});
	fs.rmdir(process.cwd() + CONFIG.file_upload_path + bill.id, (err) => {
		if (err) {
			return { error: { msg: 'File Operation Error' } };
		}
	});
}
module.exports.deleteFileFromDisk = deleteFileFromDisk;

const getBillsDueByUser = async function(req, res) {
	const body = req.body;
	let err, user;
	logger.info('Bill :: GetBillsDueByUser');
	statsd.increment("GET BILLS DUE USER");

	
	[err, user] = await searchByEmail(req);
	if (err) {
		logger.error("Bill :: GetBillsDueByUser :: User Not Found");
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	getBillsDue(req,user);
	logger.info('Bill :: GetBillsDueByUser :: Successfull');
	return ReS(res, {}, 201,'GET BILLS DUE BY USER');

}

module.exports.getBillsDueByUser = getBillsDueByUser;

const getBillsDue = async function(req,user) {
	let err, bill;

	let fromDate = new Date();
	let noOfDays = req.params.x
	let toDate = new Date();
	toDate.setDate(toDate.getDate() + Number(noOfDays));
	logger.info(`Bill :: GetBillsDue :: From Date: ${fromDate} To Date: ${toDate}`);

	startTimer();
	[err, bill] = await to(Bill.findAll({
		where: { 
			owner_id: user.id,
			due_date : {
				[Op.between]: [fromDate,toDate]
			}
		 }, 
		include: [{
			model: File,
			as: 'attachment' // specifies how we want to be able to access our joined rows on the returned data
		}]
	}));
	endTimer('SQL GET BILLS DUE BY USER')
	if (err || !bill) {
		logger.error('Bill :: GetBillsDue ::' + err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
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


	if(CONFIG.app === 'prod'){
		let SQSMessage={
			'user':user,
			'billsDue':[]
		};

		bills.forEach((item) => {
			let billUrl = `http://${CONFIG.domain_name}/v1/bill/${item.id}`;
			SQSMessage.billsDue.push(billUrl);
		});
		logger.debug(SQSMessage);

		await sendMessageToSQS(SQSMessage);
	}
	logger.info(`Bill :: GetBillsDue :: Successfull`);
}
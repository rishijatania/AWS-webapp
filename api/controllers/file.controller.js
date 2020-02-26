const { User, Bill, File } = require('../models');
const authService = require('../services/auth');
const { to, ReE, ReS } = require('../services/util');
const { searchByEmail } = require('./user.controller');
const { searchBillById, deleteFileFromDisk } = require('./bill.controller');
const os = require('os');
const fs = require('fs');
const md5 = require('md5');
const CONFIG = require('../config/config');
const { s3_delete } = require("../app");

const createFile = async function (req, res) {
	var file = {};
	file.file_name = req.file.originalname;
	file.url = req.file.path;
	file.file_size = req.file.size;
	file.file_type = req.file.mimetype;
	file.encoding = req.file.encoding;
	file.buffer = req.file.buffer;
	console.log(req.file);
	console.log(file);
	let err, user, bill, hash, buff;

	[err, bill] = await searchBillById(req.params.id);
	if (!bill || err) {
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}
	if (bill.attachment != null) {
		return ReE(res, { error: { msg: 'Bill Already has a file attached' } }, 400);
	}
	file.bill_id = bill.id;

	[err, user] = await searchByEmail(req);
	if (err) {
		console.log(err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	if (user.id !== bill.owner_id) {
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}

	buff = (CONFIG.app === 'prod') ? file.buffer : fs.readFileSync(file.url);
	file.checksum = md5(buff);

	[err, file] = await to(File.create(file));
	if (err || !file) {
		console.log(err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
	}

	file.bill_id = undefined;
	file.file_size = undefined;
	file.file_type = undefined;
	file.encoding = undefined;
	file.checksum = undefined;
	return ReS(res, file.toWeb(), 201);

};
module.exports.createFile = createFile;

const getFileById = async function (req, res) {
	let err, user, bill;

	[err, bill] = await searchBillById(req.params.id);
	if (!bill || err) {
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}

	if (req.params.fid != bill.attachment.id) {
		return ReE(res, { error: { msg: 'File Not Found' } }, 404);
	}

	[err, user] = await searchByEmail(req);
	if (err) {
		console.log(err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	if (user.id !== bill.owner_id) {
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}

	bill.attachment.bill_id = undefined;
	bill.attachment.file_size = undefined;
	bill.attachment.file_type = undefined;
	bill.attachment.encoding = undefined;
	bill.attachment.checksum = undefined;
	return ReS(res, bill.attachment.toWeb(), 200);

};
module.exports.getFileById = getFileById;

const deleteFileById = async function (req, res) {

	let err, user, bill, file;

	[err, bill] = await searchBillById(req.params.id);
	if (bill == undefined || err) {
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}

	[err, user] = await searchByEmail(req);

	if (err) {
		return ReE(res, { error: { msg: 'Database Operation Error' } }, 400);
	}

	if (user.id !== bill.owner_id) {
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}

	[err, file] = await to(File.destroy({ where: { id: req.params.fid, bill_id: req.params.id } }));
	if (err) {
		return ReE(res, { error: { msg: 'Database Operation Error' } }, 500);
	}
	if (file === 0) {
		return ReE(res, { error: { msg: 'File Not Found' } }, 404);
	}

	if (CONFIG.app === 'prod') {
		err = await s3_delete(req, res, bill.attachment);
		if (err) {
			return ReE(res, err, 400);
		}
	} else {
		err = deleteFileFromDisk(bill);
		if (err) {
			return ReE(res, err, 500);
		}
	}
	return ReS(res, {}, 204);
};

module.exports.deleteFileById = deleteFileById;
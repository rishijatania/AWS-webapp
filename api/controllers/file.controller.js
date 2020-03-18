const { User, Bill, File } = require('../models');
const authService = require('../services/auth');
const { to, ReE, ReS } = require('../services/util');
const { searchByEmail } = require('./user.controller');
const { searchBillById, deleteFileFromDisk } = require('./bill.controller');
const os = require('os');
const fs = require('fs');
const md5 = require('md5');
const CONFIG = require('../config/config');
const { s3_upload, s3_delete, logger } = require("../app");
const SDC = require('statsd-client');
const statsd = new SDC({host: 'localhost', port: 8125});

const createFile = async function (req, res) {
	logger.info("File :: Create");
	statsd.increment("POST FILE ID");
	var file = {};
	file.file_name = req.file.originalname;
	file.file_size = req.file.size;
	file.file_type = req.file.mimetype;
	file.encoding = req.file.encoding;
	file.buffer = req.file.buffer;
	logger.debug('File :: Create :: file info'+req.file);
	logger.debug(file);
	let err, user, bill, hash, buff;
	
	[err, bill] = await searchBillById(req.params.id);
	if (!bill || err) {
		logger.error('File :: Create :: Bill Not Found');
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}
	if (bill.attachment != null) {
		logger.error('File :: Create :: Bill Already has a file attached');
		return ReE(res, { error: { msg: 'Bill Already has a file attached' } }, 400);
	}
	file.bill_id = bill.id;

	[err, user] = await searchByEmail(req);
	if (err) {
		logger.error('File :: Create :: ' + err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	if (user.id !== bill.owner_id) {
		logger.error('File :: Create :: Unauthorized : Authentication error');
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}

	buff = (CONFIG.app === 'prod') ? file.buffer : fs.readFileSync(file.url);
	file.checksum = md5(buff);

	let uploaderr,success ;
	[uploaderr,success] = await to(s3_upload(req));
	if (uploaderr) {
		logger.error('File :: Create :: '+ uploaderr);
		return ReE(res, {uploaderr} , 400);
	}
	file.url = req.file.path;
	[err, file] = await to(File.create(file));
	if (err || !file) {
		logger.error('File :: Create :: '+ err.message);
		return ReE(res, { error: { msg: err.message } }, 400);
	}

	file.bill_id = undefined;
	file.file_size = undefined;
	file.file_type = undefined;
	file.encoding = undefined;
	file.checksum = undefined;
	logger.info('File :: Create :: Successfull');
	return ReS(res, file.toWeb(), 201);

};
module.exports.createFile = createFile;

const getFileById = async function (req, res) {
	let err, user, bill;
	logger.info("File :: GetFileById");
	statsd.increment("GET FILE ID");
	[err, bill] = await searchBillById(req.params.id);
	if (!bill || err) {
		logger.error('File :: GetFileById :: Bill Not Found');
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}

	if (req.params.fid != bill.attachment.id) {
		logger.error('File :: GetFileById :: File Not Found');
		return ReE(res, { error: { msg: 'File Not Found' } }, 404);
	}

	[err, user] = await searchByEmail(req);
	if (err) {
		logger.debug(err.message);
		logger.error('File :: GetFileById :: User Not Found');
		return ReE(res, { error: { msg: err.message } }, 400);
	}
	if (user.id !== bill.owner_id) {
		logger.error('File :: GetFileById :: Unauthorized : Authentication error');
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}

	bill.attachment.bill_id = undefined;
	bill.attachment.file_size = undefined;
	bill.attachment.file_type = undefined;
	bill.attachment.encoding = undefined;
	bill.attachment.checksum = undefined;
	logger.info("File :: GetFileById :: Successfull ");
	logger.debug(bill.attachment.toWeb())
	return ReS(res, bill.attachment.toWeb(), 200);

};
module.exports.getFileById = getFileById;

const deleteFileById = async function (req, res) {

	let err, user, bill, file;
	logger.info("File :: DeleteFileById");
	statsd.increment("DELETE FILE ID");
	[err, bill] = await searchBillById(req.params.id);
	if (bill == undefined || err) {
		logger.error("File :: DeleteFileById :: Bill Not Found");
		return ReE(res, { error: { msg: 'Bill Not Found' } }, 404);
	}

	[err, user] = await searchByEmail(req);

	if (err) {
		logger.error("File :: DeleteFileById :: User Not Found");
		return ReE(res, { error: { msg: 'Database Operation Error' } }, 400);
	}

	if (user.id !== bill.owner_id) {
		logger.error("File :: DeleteFileById :: Unauthorized : Authentication error");
		return ReE(res, { error: { msg: "Unauthorized : Authentication error" } }, 401);
	}

	[err, file] = await to(File.destroy({ where: { id: req.params.fid, bill_id: req.params.id } }));
	if (err) {
		logger.error("File :: DeleteFileById :: Unauthorized : File Delete Failed from DB");
		return ReE(res, { error: { msg: 'Database Operation Error' } }, 500);
	}
	if (file === 0) {
		logger.error("File :: DeleteFileById :: File Not Found");
		return ReE(res, { error: { msg: 'File Not Found' } }, 404);
	}

	if (CONFIG.app === 'prod') {
		err = await s3_delete(req, res, bill.attachment);
		if (err) {
			logger.error("File :: DeleteFileById :: File Delete Failed from S3");
			return ReE(res, err, 400);
		}
	} else {
		err = deleteFileFromDisk(bill);
		if (err) {
			logger.error("File :: DeleteFileById :: File Delete Failed from Disk");
			return ReE(res, err, 500);
		}
	}
	logger.info("File :: DeleteFileById :: Successfull");
	return ReS(res, {}, 204);
};

module.exports.deleteFileById = deleteFileById;
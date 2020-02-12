const express = require('express');
const router = express.Router();
const auth = require('../services/auth');
const UserController = require('../controllers/user.controller');
const BillController = require('../controllers/bill.controller');
const FileController = require('../controllers/file.controller');
const { createBillValidator, getBillValidator, updateBillValidator, createUserValidator, fileUploadValidator, getFileValidator, validate } = require('../services/validator');
const { upload } = require("../app");
// const { fileUpload } = require("../services/util");

//User
router.post('/user', createUserValidator(),validate, UserController.create); 
router.get('/user/self', auth.basicAuth, UserController.get);
router.put('/user/self', createUserValidator(),validate, auth.basicAuth, UserController.update);

//Bill
router.post('/bill',  createBillValidator(), validate, auth.basicAuth, BillController.createBill);
router.get('/bills', auth.basicAuth, BillController.getBillsByUser);
router.get('/bill/:id', getBillValidator(), validate, auth.basicAuth, BillController.getBillById);
router.put('/bill/:id', updateBillValidator(), validate, auth.basicAuth, BillController.updateBillById);
router.delete('/bill/:id', getBillValidator(), validate, auth.basicAuth, BillController.deleteBillById);

//File
router.post('/bill/:id/file', upload, fileUploadValidator, getBillValidator(), validate, auth.basicAuth, FileController.createFile);
router.get('/bill/:id/file/:fid', getFileValidator(), validate, auth.basicAuth, FileController.getFileById);
router.delete('/bill/:id/file/:fid', getFileValidator(), validate, auth.basicAuth, FileController.deleteFileById);

module.exports = router;
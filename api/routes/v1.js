const express = require('express');
const router = express.Router();
const auth = require('../services/auth');
const UserController = require('../controllers/user.controller');
const BillController = require('../controllers/bill.controller');
// const { createBillValidator, validate } = require('../services/validator.js');
const regex = "[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}";
//User
router.post('/user', UserController.create); 
router.get('/user/self', auth.basicAuth, UserController.get);
router.put('/user/self', auth.basicAuth, UserController.update);

//Bill
router.post('/bill',  auth.basicAuth, BillController.createBill);
router.get('/bills', auth.basicAuth, BillController.getBillsByUser);
router.get(`/bill/:id(${regex})`, auth.basicAuth, BillController.getBillById);    // R
router.put(`/bill/:id(${regex})`, auth.basicAuth, BillController.updateBillById); // U
router.delete(`/bill/:id(${regex})`, auth.basicAuth, BillController.deleteBillById); // D

module.exports = router;
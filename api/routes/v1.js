const express = require('express');
const router = express.Router();
const auth = require('../services/auth');
const UserController = require('../controllers/user.controller');
const BillController = require('../controllers/bill.controller');
const { createBillValidator, getBillValidator, updateBillValidator, validate } = require('../services/validator');

//User
router.post('/user', UserController.create); 
router.get('/user/self', auth.basicAuth, UserController.get);
router.put('/user/self', auth.basicAuth, UserController.update);

//Bill
router.post('/bill',  createBillValidator(), validate, auth.basicAuth, BillController.createBill);
router.get('/bills', auth.basicAuth, BillController.getBillsByUser);
router.get('/bill/:id', getBillValidator(), validate, auth.basicAuth, BillController.getBillById);
router.put('/bill/:id', updateBillValidator(), validate, auth.basicAuth, BillController.updateBillById);
router.delete('/bill/:id', getBillValidator(), validate, auth.basicAuth, BillController.deleteBillById);

module.exports = router;
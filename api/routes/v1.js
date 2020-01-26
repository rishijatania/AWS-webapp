const express 			= require('express');
const router 			= express.Router();
const auth          = require('../services/auth');
const UserController 	= require('../controllers/user.controller');

router.post('/user', UserController.create);   // C
router.get('/user/self', auth.basicAuth, UserController.get);        // R
router.put('/user/self', auth.basicAuth, UserController.update);     // U

module.exports = router;
const { check, body, param, validationResult } = require('express-validator');
const { ReE }  = require('../services/util');

const createBillValidator = () => {
	return [
		body('vendor').exists().isString(),
		body('bill_date').exists().custom(isValidDate),
		body('due_date').exists().custom(isValidDate),
		body('amount_due').exists().isFloat({min:0.01}),
		body('categories').exists().isArray(),
		body('paymentStatus').exists().isIn(['paid', 'due', 'past_due', 'no_payment_required']),
	]
}

const createUserValidator = () => {
	return [
		body('first_name').exists().isString(),
		body('last_name').exists().isString(),
		body('password').exists().isString(),
		body('email_address').exists().isString().isEmail(),
	]
}

const getBillValidator = () => {
	return [
		param('id').exists().isUUID()
	]
}

const getBillsDueValidator = () => {
	return [
		param('x').exists().isNumeric()
	]
}

const getFileValidator = () => {
	return [
		param('fid').exists().isUUID(),
		param('id').exists().isUUID()
	]
}

const fileUploadValidator = (req,res,next) => {
	console.log(req.file);
	if(!req.file){
		return ReE(res, {error:{msg: 'File Upload Error'}} , 400);
	}
	next()
}

const updateBillValidator = () => {
	return [
		param('id').exists().isUUID(),
		body('vendor').exists().isString(),
		body('bill_date').exists().custom(isValidDate),
		body('due_date').exists().custom(isValidDate),
		body('amount_due').exists().isFloat({min:0.01}),
		body('categories').exists().isArray(),
		body('paymentStatus').exists().isIn(['paid', 'due', 'past_due', 'no_payment_required']),
	]
}

function isValidDate(value) {
	if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
  
	const date = new Date(value);
	if (!date.getTime()) return false;
	return date.toISOString().slice(0, 10) === value;
  }

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))

  return res.status(400).json({
    errors: extractedErrors,
  })
}

module.exports = {
	createBillValidator,
	updateBillValidator,
	getBillValidator,
	validate,
	createUserValidator,
	fileUploadValidator,
	getFileValidator,
	getBillsDueValidator
}
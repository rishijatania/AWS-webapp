const { User, Bill }    = require('../models');
const authService       = require('../services/auth');
const { to, ReE, ReS }  = require('../services/util');
const { searchByEmail } = require('./user.controller');


// var n = fruits.includes("Mango");

const createBill = async function(req, res){
    const body = req.body;

	//Add field missing check , check for due date greateer than bill date,  
	//validate like if due_date pass the current date should we keep the status as past_due and validat, 
	//no validation on categories. Ideally you would remove duplicates instead of bad request.

    // if(!body.email_address){
    //     return ReE(res, {error:{ msg: 'Email Address is missing'}} ,400);
    // } else if(!body.password){
    //     return ReE(res, {error:{ msg: 'Password is missing'}} ,400);
    // }else{
        let err, user, bill;
		//delete unwanted fields
        // delete body.account_updated;
        // delete body.account_created;
        // delete body.id;
		
        [err, user] = await searchByEmail(req);
		if(user) {
			console.log(user.id)
			body.owner_id=user.id;
			// console.log(body.categories);
			// [err, bill] = await to(user.setBills(body));
			[err, bill] = await to(Bill.create(body));
			if (err || !bill ) {
				console.log(err.message);
				return ReE(res, {error:{msg: err.message}} , 400);
			}
			
			//Remove password from response
			// user.password = undefined;
			return ReS(res, bill.toWeb(), 201);
		}
		else{
			return ReE(res, {error:{msg: 'User Not Found'}} , 401);
		}

    // }
};
module.exports.createBill = createBill;

const getBillsByUser = async function(req, res){
    const body = req.body;
    let err, user, bill;
		
	[err, user] = await searchByEmail(req);
	if(user) {
		console.log(user.id);
		[err, bill] = await to(Bill.findAll({where: {owner_id: user.id}}));
		if (err || !bill ) {
			console.log(err.message);
			return ReE(res, {error:{msg: err.message}} , 400);
		}
		let bills = [];
		bill.forEach((item)=>bills.push(item.toWeb()));
		return ReS(res, bills, 201);
	}
	else{
		return ReE(res, {error:{msg: 'User Not Found'}} , 401);
	}
};
module.exports.getBillsByUser = getBillsByUser;

const getBillById = async function(req, res){
	let err, user, bill;

	[err, bill] = await searchBillById(req.params.id);
	if(bill) {
		[err, user] = await searchByEmail(req);
		if (err) {
			console.log(err.message);
			return ReE(res, {error:{msg: err.message}} , 400);
		}
		if(user.email_address!==req.email_address){
			return ReE(res, {error:{msg: "Unauthorized : Authentication error"}} , 401);
		}		
		return ReS(res, bill.toWeb(), 200);
	}
	else{
		return ReE(res, {error:{msg: 'Bill Not Found'}} , 404);
	}
};
module.exports.getBillById = getBillById;

const searchBillById = async function(id){
	return await to(Bill.findByPk(id));	
}

module.exports.searchBillById = searchBillById;

const deleteBillById = async function(req, res){
    const body = req.body;
	let err, user, bill;
	console.log(req.params.id);
	[err, user] = await searchByEmail(req);
	console.log("user id" + user.id);
	if(user) {
		[err, bill] = await to(Bill.destroy({where:{id: req.params.id, owner_id:user.id}}));	
		console.log(bill);
		if (err || bill===0) {
			console.log("errpr " + err);
			return ReE(res, {error:{msg: "Bill Not Found"}} , 404);
		}		
		return ReS(res, {}, 204);
	}
	else {
		return ReE(res, {error:{msg: 'User Not Found'}},401);
	}
};
module.exports.deleteBillById = deleteBillById;

const updateBillById = async function(req, res){
	const body = req.body;

	let err, user, bill,success,msg;
	console.log(req.params.id);
	[err, bill] = await searchBillById(req.params.id);
	if(!bill || err) {
		return ReE(res, {error:{msg: "Bill Not Found"}},404);
	}

	[err, user]= await searchByEmail(req);

	if(!user || err || user.id!==bill.owner_id){
		return ReE(res, {error:{msg: "Unauthorized : Authentication error"}} , 401)
	}
	
	bill.vendor=body.vendor;
	bill.bill_date= body.bill_date;
	bill.due_date=body.due_date;
	bill.amount_due= body.amount_due;
	bill.paymentStatus=body.paymentStatus;
	bill.categories=body.categories;

	[err, success] = await to(bill.save());

	if (err || !success) {
		console.log("errpr " + err.message);
		msg = err.message.includes('Validation error')? err.message : 'Database Operation Error';
		return ReE(res, {error:{msg: msg} }, 400);
	}
	return ReS(res, success.toWeb(), 200);
};
module.exports.updateBillById = updateBillById;
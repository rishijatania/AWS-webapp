const { User, Bill, File }    = require('../models');
const authService       = require('../services/auth');
const { to, ReE, ReS }  = require('../services/util');
const { searchByEmail } = require('./user.controller');

const createBill = async function(req, res){
    const body = req.body;

	let err, user, bill;

	//Round of to 2 decimal
	body.amount_due= body.amount_due.toFixed(2);

	if(Date.parse(body.due_date)<Date.parse(body.bill_date)){
		return ReE(res, {error:{msg: "Due Date should be after the Bill date"}} , 400);
	}

	body.categories= body.categories.filter( onlyUnique );

	[err, user] = await searchByEmail(req);
	if(err){
		return ReE(res, {error:{msg: err.message}} , 400);
	}

	body.owner_id=user.id;

	[err, bill] = await to(Bill.create(body));
	if (err || !bill ) {
		console.log(err.message);
		return ReE(res, {error:{msg: err.message}} , 400);
	}
	bill=bill.toWeb();
	bill.attachment={};
	// console.log(bill.toWeb());
	return ReS(res, bill, 201);
	
};
module.exports.createBill = createBill;

const getBillsByUser = async function(req, res){
    const body = req.body;
    let err, user, bill;
		
	[err, user] = await searchByEmail(req);
	if(err){
		return ReE(res, {error:{msg: err.message}} , 400);
	}

	[err, bill] = await to(Bill.findAll({where: {owner_id: user.id},include:[{model: File,
		as: 'attachment' // specifies how we want to be able to access our joined rows on the returned data
	  }]}));
	if (err || !bill ) {
		console.log(err.message);
		return ReE(res, {error:{msg: err.message}} , 400);
	}
	let bills = [];
	bill.forEach((item)=>{
		item=item.toWeb();
		if(item.attachment===null){
			item['attachment']={};		
		}
		bills.push(item);
	});
	return ReS(res, bills, 200);

};
module.exports.getBillsByUser = getBillsByUser;

const getBillById = async function(req, res){
	let err, user, bill;

	[err, bill] = await searchBillById(req.params.id);
	if(!bill || err) {
		return ReE(res, {error:{msg: 'Bill Not Found'}} , 404);
	}

	[err, user] = await searchByEmail(req);
	if (err) {
		console.log(err.message);
		return ReE(res, {error:{msg: err.message}} , 400);
	}
	if(user.id!==bill.owner_id){
		return ReE(res, {error:{msg: "Unauthorized : Authentication error"}} , 401);
	}
	bill=bill.toWeb();
	if(bill.attachment===null){
		bill['attachment']={};		
	}
	return ReS(res,bill , 200);
		
};
module.exports.getBillById = getBillById;

const searchBillById = async function(id){
	console.log(id)
	return await to(Bill.findOne({where : {id:id}, include:'attachment'}));	
};

module.exports.searchBillById = searchBillById;

const deleteBillById = async function(req, res){
    const body = req.body;
	let err, user, bill;
	console.log(req.params.id);

	[err, bill] = await searchBillById(req.params.id);
	if(err || !bill){
		return ReE(res, {error:{msg: "Bill Not Found"}} , 404);
	}

	[err, user] = await searchByEmail(req);
	console.log("user id" + user.id);
	if(err) {
		return ReE(res, {error:{msg:'Database Operation Error' }},400);
	}

	if(user.id!==bill.owner_id){
		return ReE(res, {error:{msg: "Unauthorized : Authentication error"}},401);
	}
	
	[err, bill]= await to(Bill.destroy({where:{id: req.params.id, owner_id:user.id}}));

	if (err || bill===0) {
		return ReE(res, {error:{msg:'Database Operation Error' }},500);
	}		
	return ReS(res, {}, 204);
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
	
	//Round of to 2 decimal
	body.amount_due= body.amount_due.toFixed(2);

	if(Date.parse(body.due_date)<Date.parse(body.bill_date)){
		return ReE(res, {error:{msg: "Due Date should be after the Bill date"}} , 400);
	}

	body.categories= body.categories.filter( onlyUnique );

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

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}
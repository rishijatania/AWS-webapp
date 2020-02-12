const {to} = require('await-to-js');
const pe = require('parse-error');
// const http = require('http');
// const path = require('path');
// const os = require('os');
// const fs = require('fs');
// const Busboy = require('busboy');

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if(err) return [pe(err)];

    return [null, res];
};

module.exports.ReE = ReE = function(res, err, code){ // Error Web Response
    if(typeof err == 'object' && typeof err.message != 'undefined'){
        err = err.message;
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json(err);
};

module.exports.ReS = function(res, data, code){ // Success Web Response
    let send_data;// = {success:true};

    if(typeof data == 'object'){
        send_data = Object.assign(data, send_data);//merge the objects
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json(send_data)
};

module.exports.TE = TE = function(err_message, log){ // TE stands for Throw Error
    if(log === true){
        console.error(err_message);
    }

    throw new Error(err_message);
};

// module.exports.fileUpload = function(req,res,next){
// 	console.log("start");
// 	var busboy = new Busboy({ headers: req.headers });
//     busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
// 		if (!(file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype=='application/pdf')){
// 			let err={error:{msg: "Invalid file type. Only jpg, jpeg, png and pdf files are allowed."}};	
// 			return ReE(res,err,400);
// 		}
// 		let relativePath='public/assets/';
// 		let finalfilename=filename.split('.')[0] + '_' + req.params.id + "." + filename.split('.')[1];
// 		var saveTo = path.join(process.cwd(),'/',relativePath,finalfilename);
// 		var outStream = fs.createWriteStream(saveTo);
// 		let size = fs.createWriteStream(saveTo).bytesWritten;
// 		file.pipe(outStream)
// 		outStream.on('error', next(err));
// 		outStream.on('finish', function () {
// 			req.file={
// 				filename: finalfilename,
// 				path: relativePath,
// 				size: size,
// 				encoding: encoding,
// 				mimetype: mimetype
// 			}
// 			console.log(req.file);
//     	})
// 	})
//     busboy.on('finish', function() {
// 		console.log("finish");
// 		next();
//     })

//     return req.pipe(busboy); 
// };


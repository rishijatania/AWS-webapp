'use strict';

const {TE, to} = require('../services/util');
const Sequelize = require('sequelize');

//Schema
module.exports = (sequelize, DataTypes) => {
    let Model = sequelize.define('File', {
		id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, primaryKey: true},
		bill_id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, allowNull:false},
		file_name: {type: DataTypes.STRING, allowNull:false},
		url: {type: DataTypes.STRING,allowNull:false},	//validate: { isUrl: true } 
		file_size: {type: DataTypes.FLOAT, allowNull:false},
		file_type: {type: DataTypes.STRING, allowNull:false},
		encoding: {type: DataTypes.STRING, allowNull:false},
		checksum: {type: DataTypes.CHAR(32), allowNull:false},
        upload_date: Sequelize.DATE,
        },{
        updatedAt: false,
        createdAt: 'upload_date'
	});
	
    Model.prototype.toWeb = function () {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
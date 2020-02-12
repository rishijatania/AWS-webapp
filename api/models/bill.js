'use strict';

const {TE, to} = require('../services/util');
const Sequelize = require('sequelize');

//Schema
module.exports = (sequelize, DataTypes) => {
    let Model = sequelize.define('Bill', {
		id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, primaryKey: true},
		owner_id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, allowNull:false},
		vendor: {type: DataTypes.STRING, allowNull:false},
		bill_date: {type: DataTypes.DATEONLY,allowNull:false},
		due_date: {type: DataTypes.DATEONLY,allowNull:false},
        amount_due: {type: DataTypes.DOUBLE, allowNull: false, validate: { min: { args: 0.01, msg:"Amount due less than 0.01" }}},
		categories:{
			type: Sequelize.STRING,
			allowNull: false,
			get() {
				return this.getDataValue('categories').split(',');
			},
			set(val) {
				this.setDataValue('categories',val.join(','));
			}
		},
		paymentStatus: {type: DataTypes.ENUM('paid', 'due', 'past_due', 'no_payment_required'),allowNull:false},
		// console.log(Model.rawAttributes.states.values);
        // email_address: {type: DataTypes.STRING,unique: true},
        // phone     : {type: DataTypes.STRING, allowNull: true, unique: true, validate: { len: {args: [7, 20], msg: "Phone number invalid, too short."}, isNumeric: { msg: "not a valid phone number."} }},
        created_ts: Sequelize.DATE,
        updated_ts: Sequelize.DATE,
        },{
        updatedAt: 'updated_ts',
        createdAt: 'created_ts'
    });

	Model.associate = function(models){
		Model.hasOne(models.File,{foreignKey: 'bill_id', as: 'attachment'});
	};

    Model.prototype.toWeb = function () {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
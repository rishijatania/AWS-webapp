'use strict';

const bcrypt = require('bcrypt');
const bcrypt_p = require('bcrypt-promise');
const {TE, to} = require('../services/util');
const Sequelize = require('sequelize');

//Schema
module.exports = (sequelize, DataTypes) => {
    let Model = sequelize.define('User', {
        id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, primaryKey: true},
        first_name: {type: DataTypes.STRING, allowNull: false, validate: { notNull: { msg: 'Please enter your first name'} } },
        last_name: {type: DataTypes.STRING, allowNull: false, validate: { notNull: { msg: 'Please enter your last name'} }},
        password: {type: DataTypes.STRING, allowNull: false, validate: { notNull: { msg: 'Please enter your password'} }},
        email_address: {type: DataTypes.STRING,unique: true, allowNull:false, validate: { notNull: { msg: 'Please enter your email'} }},
        // phone     : {type: DataTypes.STRING, allowNull: true, unique: true, validate: { len: {args: [7, 20], msg: "Phone number invalid, too short."}, isNumeric: { msg: "not a valid phone number."} }},
        account_created: Sequelize.DATE,
        account_updated: Sequelize.DATE,
        },{
        updatedAt: 'account_updated',
        createdAt: 'account_created'
    });

	Model.associate = function(models){
		Model.hasMany(models.Bill,{foreignKey: 'owner_id', as: 'bills' });
	};

    Model.beforeSave(async (user, options) => {
        let err;

        if (user.changed('password')){
            let salt, hash;
            [err, salt] = await to(bcrypt.genSalt(10));
            if(err) TE(err.message, true);

            [err, hash] = await to(bcrypt.hash(user.password, salt));
            if(err) TE(err.message, true);

            user.password = hash;
        }
    });

    Model.prototype.comparePassword = async function (pw) {
        if(!this.password) TE('password not set');

        return bcrypt.compare(pw, this.password);
    };

    Model.prototype.toWeb = function () {
        let json = this.toJSON();
        return json;
    };

    return Model;
};
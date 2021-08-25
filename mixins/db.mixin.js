const DbService = require('moleculer-db');
const SqlAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require('sequelize');

module.exports = function(collection){

	const schema = {
		mixins: [DbService],
	};
	if(process.env.DB_HOST && process.env.DB_PORT){
		schema.adapter = new SqlAdapter(
			process.env.DB_DATABASE,
			process.env.DB_USER,
			process.env.DB_PASS,
			{
				host: process.env.DB_HOST,
				port: process.env.DB_PORT,
				dialect: 'mysql',
				pool: {
					max: 20,
					min: 0,
					idel: 10000,
				},
			});
	}else{
		schema.adapter = new SqlAdapter(
			'test',
			'root',
			'', 
			{
				host: '127.0.0.1',
				port: 3306,
				dialect: 'mysql',
				pool: {
					max: 10,
					min: 0,
					idle: 10000,
				},
			});
	}
	if(collection) schema.collection = collection;
	return schema;
};

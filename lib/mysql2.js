const mysql = require('mysql2/promise');

class db{
	static async open(options){
		options = options || {};
		let db_config = {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE,
		};
		let conn; //** 数据库连接
		//** 并行还是串行，默认并行
		if(options.sync){
			conn = await mysql.createConnection(db_config);
		}else{
			conn = await mysql.createPool(db_config);
		}
		return conn;
	};

	static async exec(conn,sql,options){
		if(arguments.length<2) throw new Error('参数不正确');
		options = options || {};
		return new Promise(async (resolve,reject)=>{
			if(options.verbose) console.debug(sql);
			conn.execute(sql)
				.then(([rows,fields])=>{
					resolve([rows,fields]);
				})
				.catch((e)=>{
					if(options.verbose) console.error(e);
					resolve(false);
				});
		});
	};
};

exports = module.exports = db;

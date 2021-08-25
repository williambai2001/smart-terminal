const mysql = require('mysql2');

const connection = mysql.createConnection({
	host: '192.168.80.230',
	port: 4000,
	user: 'root',
	password: '123456',
	database: 'terminalservice',
});

connection
	.promise()
	.query('SELECT * FROM terminals_1 limit 2')
	.then(([rows,fields]) => {
		// console.log(rows);
		// console.log(fields);
	})
	.catch(console.log)
	.then(()=>connection.end());


const pool = mysql.createPool({
	host: '192.168.80.230',
	port: 4000,
	user: 'root',
	password: '123456',
	database: 'terminalservice',
	waitForConnections: true,
	// connectionlimit: 10,
	// queryLimit: 0,
});

pool
	.promise()
	.query('SELECT * FROM terminals_1 limit 2')
	.then(([rows,fields]) => {
		// console.log(rows);
		// console.log(fields);
	})
	.catch(console.log)
	.then(()=>pool.end());

// (async function(){
// 	let poolPromise = pool.promise();
// 	[rows,fields] = await poolPromise.query('SELECT * FROM terminals_1 limit 2');
// 	console.log('---3---');
// 	console.log(rows);
// 	poolPromise.end();
// })();

// //** 插入
// (async function(){
// 	const Terminal = require('./entities/terminal.class');
// 	let poolPromise = pool.promise();
// 	const getNewTerminalEntity = function(){
// 		let terminal = new Terminal();
// 		return terminal;
// 	};
// 	let terminalRecord = getNewTerminalEntity();
// 	[rows,fields] = await poolPromise.query('INSERT INTO terminals_0 SET ? ',terminalRecord);
// 	console.log('---3---');
// 	console.log(rows);
// 	poolPromise.end();
// })();

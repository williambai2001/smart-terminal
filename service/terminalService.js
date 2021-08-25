const _ = require('underscore');
const moment = require('moment');
const {exec,spawn,spawnSync} = require('child_process');

const serviceCode = require('./serviceCode');

const mysql2 = require('../lib/mysql2');
const terminalRecordDTS = require('../dts/terminal_record');

class terminalService{

	//** 编辑配置文件
	static async editConfig(filename){
		return new Promise(function(resolve,reject){
			//** 编辑配置文件
			try{
				const vim = spawn('vim',[filename],{stdio: 'inherit',detached: true});
				vim.on('error',(e)=>{
					if(/ENOENT/.test(e.message)) console.log('命令不存在！！！');
					console.log(e);
				});
				vim.on('close',resolve);
			}catch(e){
				console.error(e);
				resolve(e);
			}
		});
	};

	/**
	 * 创建分区表
	 */
	static async createShardingTables(options){
		options = options || {};
		let conn = await mysql2.open();
		let shardings = process.env.TABLE_SHARDING || 64;
		let database = process.env.DB_DATABASE;
		let tablePrefix = process.env.TABLE_TERMINAL_PREFIX;
		let success = true;
		let tablePromises = [];
		for(let i=0;i<shardings;i++){
			let sql = terminalRecordDTS.createTable(database,tablePrefix+i);
			tablePromises.push(mysql2.exec(conn,sql,options));
		}
		try{
			await Promise.all(tablePromises);
		}catch(e){
			if(options.verbose) console.error(e);
			success = false;
		}
		let response = {};
		await conn.end();
		if(!success) return _.extend({},serviceCode[3001]);
		return _.extend(response,serviceCode[2000]);
	};

	/**
	 * 获取表分区
	 */
	static async getTablePartitions(database,table,options){
		if(arguments.length<2) throw new Error('参数不正确');
		options = options || {};
		let conn = await mysql2.open();
		let sql = terminalRecordDTS.getTablePartitions(database,table);
		const [rows,fields] = await mysql2.exec(conn,sql,options);
		conn.end();
		return rows;
	};

	/**
	 * 更新表分区
	 */
	static async updateTablePartition(options){
		options = options || {};
		let conn = await mysql2.open();
		let success = true;
		let tablePromises = [];
		//** database & table prefix
		let database = process.env.DB_DATABASE;
		let future_days = process.env.TABLE_PARTITION_FORWARD || 7;
		for(let i=0;i<64;i++){
			//** 表名
			let table = process.env.TABLE_TERMINAL_PREFIX + i;
			//** 获取分区表
			let sql = terminalRecordDTS.getTablePartitions(database,table);
			let [partitions,fields] = await mysql2.exec(conn,sql,options);
			partitions = _.pluck(partitions||[],'partition_name');
			//** 是否未来一周的分区表名已经存在
			let weekdays = [];
			for(let i=0;i<future_days;i++){
				weekdays.push('p'+moment().add(i,'day').format('YYYYMMDD'));
			}
			//** 过滤出当前需要增加的分区
			partitions = _.difference(weekdays,partitions);
			// console.log(partitions)
			let sql2 = terminalRecordDTS.addTablePartitions(database,table,partitions);
			tablePromises.push(mysql2.exec(conn,sql2,options));
		}
		try{
			await Promise.all(tablePromises);
		}catch(e){
			if(options.verbose) console.error(e);
			success = false;
		}
		await conn.end();
		return success;
	};

	/**
	 * 更名分区表
	 */
	static async renameShardingTables(options){
		options = options || {};
		let conn = await mysql2.open();
		let shardings = process.env.TABLE_SHARDING || 64;
		let database = process.env.DB_DATABASE;
		let tableOld = process.env.TABLE_TERMINAL_PREFIX;
		let tableNew = process.env.TABLE_TERMINAL_BACKUP_PREFIX;

		let success = true;
		let tablePromises = [];
		for(let i=0;i<shardings;i++){
			let sql = terminalRecordDTS.renameTable(database,tableOld+i,tableNew+i);
			tablePromises.push(mysql2.exec(conn,sql,options));
		}
		try{
			await Promise.all(tablePromises);
		}catch(e){
			if(options.verbose) console.error(e);
			success = false;
		}
		let response = {};
		await conn.end();
		if(!success) return _.extend({},serviceCode[3002]);
		return _.extend(response,serviceCode[2000]);
	};

	/** 
	 * 按分区备份数据库表，会write锁表
	 * @Depreciated
	 */
	static async backupTablePartitions(shardings,date,options){
		shardings = process.env.TABLE_SHARDING || 64;
		date = new Date(date || '1970-01-01');
		options = options || {};
		let host = process.env.DB_HOST;
		let port = process.env.DB_PORT;
		let user = process.env.DB_USER;
		let pass = process.env.DB_PASS;
		let database = process.env.DB_DATABASE;
		let tablePrefix = process.env.TABLE_TERMINAL_PREFIX;
		for(let i=0;i<shardings;i++){
			try{
				await (new Promise((resolve)=>{
					let tableName = tablePrefix + i;
					let time = date.getTime();
					let yyyymmdd = moment(date).format('YYYYMMDD');
					let cmd = `mysqldump -h ${host} -P ${port} -u ${user} -p ${pass} -t tables ${tableName} --where "create_time"<${time} >terminal-record-${yyyymmdd}.sql`;
					exec(cmd,(err,stdout,stderr)=>{
						if(err) console.error(err);
						if(stderr) console.error(stderr);
						console.log(cmd,'finished!');
						resolve(true);
					});
				}))();
			}catch(err){
				if(err) console.error(err);
				return false;
			}
		}
		return true;
	};

	/** 
	 * br命令 按全量快照备份
	 */
	static async backupSnapshot(options){
		let today = moment().format('YYYYMMDD');
		options = options || {};		
		options.ratelimit = options.ratelimit || 120;
		options.dir = options.dir || process.env.BACKUP_ROOT + '/full_' + today;
		if(!/^local/.test(options.dir)) options.dir = process.env.BACKUP_ROOT + '/' + options.dir;
		options.logfile = options.logfile || 'backuptable.log';

		let host = process.env.PD_HOST;
		let port = process.env.PD_PORT;
		return new Promise(function(resolve,reject){
			try{
				const br = spawn('br',[
								'backup',
								'full',
								`--pd=${host}:${port}`,
								`--storage=${options.dir}`,
								`--ratelimit=${options.ratelimit}`,
								`--log-file=${options.logfile}`,
							],{
								stdio: ['inherit','inherit','inherit'],
								gid: Number(process.env.TIDB_GID),
								uid: Number(process.env.TIDB_UID),
							});
				console.log('Command:\n====\n',br.spawnargs.join(' '),'\n====\n\n');
				br.on('error',(e)=>{
					if(/ENOENT/.test(e.message)) console.log('命令不存在！！！');
					console.log(e);
				});
				br.on('close',resolve);
			}catch(e){
				if(/EPERM/.test(e.message)) console.log('没有权限！！！');
				resolve(e);
			}
		});
	};

	/** 
	 * br命令 获取增量备份起点
	 */
	static async getLastbackupts(options){
		let today = moment().format('YYYYMMDD');
		options = options || {};
		if(!/^local/.test(options.dir)) options.dir = process.env.BACKUP_ROOT + '/' + options.dir;

		let host = process.env.PD_HOST;
		let port = process.env.PD_PORT;
		return new Promise(function(resolve,reject){
			let cmd = `br validate decode --field="end-version" --storage="${options.dir}" | tail -n1`;
			console.log(cmd);
			let cmdOptions= {};
			exec(cmd,cmdOptions,(err,stdout,stderr)=>{
				if(err) console.error(err);
				if(stderr) console.error(stderr);
				resolve(stdout);
			});
		});
	};

	/** 
	 * br命令 按增量备份
	 */
	static async backupIncrement(options){
		let today = moment().format('YYYYMMDD');
		//** 自动获取上次增量备份终点
		const getLastbackupts = async (dir)=>{
			return new Promise((resolve,reject)=>{
				//** 获取最新的备份日期，且lastbackupts存在
				let lastbackuptsCmd = `br validate decode --field="end-version" -s "${process.env.BACKUP_ROOT}/inc_ | tail -n1`;
				if(dir){
					lastbackuptsCmd = `br validate decode --field="end-version" -s "${process.env.BACKUP_ROOT}/${dir} | tail -n1`;
				}else{

				}
				let lastbackupts = exec(lastbackuptsCmd,(err,stdout,stderr)=>{
					if(err) console.log(err);
					if(stderr) console.log(stderr);
					//** 最后一次备份的指针终点
					resolve(stdout);
				});
			});
		};
		options = options || {};
		options.ratelimit = options.ratelimit || 120;
		options.dir = options.dir || process.env.BACKUP_ROOT + '/inc_' + today;
		if(!/^local/.test(options.dir)) options.dir = process.env.BACKUP_ROOT + '/' + options.dir;
		options.logfile = options.logfile || 'backuptable.log';

		let host = process.env.PD_HOST;
		let port = process.env.PD_PORT;

		if(!options.lastbackupts){
			options.lastbackupts = await getLastbackupts();
		}

		return new Promise(function(resolve,reject){
			try{
				const br = spawn('br',[
							'backup',
							'full',
							`--pd=${host}:${port}`,
							`--storage=${options.dir}`,
							`--ratelimit=${options.ratelimit}`,
							`--log-file=${options.logfile}`,
							`--lastbackupts=${options.lastbackupts}`,
						],{
							stdio: ['inherit','inherit','inherit'],
							gid: Number(process.env.TIDB_GID),
							uid: Number(process.env.TIDB_UID),
						});
				console.log('Command:\n====\n',br.spawnargs.join(' '),'\n====\n\n');
				br.on('error',(e)=>{
					if(/ENOENT/.test(e.message)) console.log('命令不存在！！！');
					console.log(e);
				});
				br.on('close',resolve);
			}catch(e){
				if(/EPERM/.test(e.message)) console.log('没有权限！！！');
				resolve(e);
			}
		});
	};


	/**
	 * 移除已备份表数据
	 */
	static async dropTables(options){
		options = options || {};
		let conn = await mysql2.open();
		let shardings = process.env.TABLE_SHARDING || 64;
		let database = process.env.DB_DATABASE;
		let tableBackupPrefix = process.env.TABLE_TERMINAL_BACKUP_PREFIX;
		let success = true;
		let tablePromises = [];
		for(let i=0;i<shardings;i++){
			let sql = terminalRecordDTS.dropTable(database,tableBackupPrefix+i);
			tablePromises.push(mysql2.exec(conn,sql,options));
		}
		try{
			await Promise.all(tablePromises);
		}catch(e){
			if(options.verbose) console.error(e);
			success = false;
		}
		let response = {};
		await conn.end();
		if(!success) return _.extend({},serviceCode[3003]);
		return _.extend(response,serviceCode[2000]);
	};

	/**
	 * 移除已备份表数据的时间分区
	 */
	static async dropTablePartitions(partition,options){
		options = options || {};
		let conn = await mysql2.open();
		let shardings = process.env.TABLE_SHARDING || 64;
		let database = process.env.DB_DATABASE;
		let tablePrefix = process.env.TABLE_TERMINAL_PREFIX;
		let success = true;
		let tablePromises = [];
		for(let i=0;i<shardings;i++){
			let sql = terminalRecordDTS.dropTablePartition(database,tablePrefix+i,partition);
			tablePromises.push(mysql2.exec(conn,sql,options));
		}
		try{
			await Promise.all(tablePromises);
		}catch(e){
			if(options.verbose) console.error(e);
			success = false;
		}
		let response = {};
		await conn.end();
		if(!success) return _.extend({},serviceCode[3003]);
		return _.extend(response,serviceCode[2000]);
	};

	/**
	 * 根据TABLE_PARTITION_MAX，自动清理分区数据
	 */
	static async dropTablePartitonsAuto(options){
		options = options || {};
		let database = process.env.DB_DATABASE;
		let tablePrefix = process.env.TABLE_TERMINAL_PREFIX;
		let partition_max = process.env.TABLE_PARTITION_MAX || 7;
		let future_days = process.env.TABLE_PARTITION_FORWARD || 7;
		let conn = await mysql2.open();
		let sql = terminalRecordDTS.getTablePartitions(database,tablePrefix+'0');
		const [rows,fields] = await mysql2.exec(conn,sql,options);
		let partitions = _.pluck(rows,'partition_name') || [];
		partitions = _.sortBy(partitions);

		if(partitions.length>Number(partition_max)+Number(future_days)){
			await this.dropTablePartitions(partitions[0],options);
		}
		await conn.end();
	};

	/**
	 * 随机插入下挂终端上下线模拟数据，用于性能测试
	 * 
	 */
	static async addRecordRandom(tableStartID,tableEndID,count,options){
		class TerminalRecord{
			constructor(){
			};
			getDefaultLoid(){
				return (new Date()).getTime().toString().substr(2);
			};
			getDefaultMac(){
				let rdm = Math.random().toString(16).substr(2,12);
				let mac = '';
				_.each(rdm,(r,index)=>{
					mac += r;
					if(index>0 && index%2==1) mac += ':';
				});
				return mac.slice(0,-1);
			};
			static getNames(){
				return ['loid','mac','time','create_time','update_time','online_status','status'];
			};
			getValues(){
				return [
					this.getDefaultLoid(),
					this.getDefaultMac(),
					(new Date).getTime(),
					(new Date).getTime(),
					(new Date).getTime(),
					1,
					1,
				];
			};
		};
		tableStartID = tableStartID || 0;
		tableEndID = tableEndID || 1;
		//** tables
		let tables = [];
		for(let k=tableStartID;k<tableEndID;k++){
			tables.push(process.env.TABLE_TERMINAL_PREFIX + k);
		}
		let startTime = (new Date).getTime();
		let total = count*tables.length;
		options = options || {};
		let countPerTrans = options.countPerTrans || 1;

		let conn = await mysql2.open();
		let database = process.env.DB_DATABASE;
		let success = true;
		//** 按table插入
		let recordPromise = function(table){
				let terminalRecords = [];
				for(let k=0;k<countPerTrans;k++){
					let terminalRecord = new TerminalRecord();
					//** schema 检查
					terminalRecords.push(terminalRecord.getValues());
				}
				let sql = terminalRecordDTS.insert(database,table,TerminalRecord.getNames(),terminalRecords);
				return mysql2.exec(conn,sql,options);
		};
		for(let i=0;i<count;i++){
			let recordsPromise = [];
			for(let j=tableStartID;j<tableEndID;j++){
				// console.info('当前正在插入表：',process.env.TABLE_TERMINAL_PREFIX+j);
				recordsPromise.push(recordPromise(process.env.TABLE_TERMINAL_PREFIX+j));
			}
			console.info((new Date)+'当前正在插入数据['+Number(tableEndID-tableStartID)+']['+count+']：' + i);
			success = await Promise.all(recordsPromise);
		}

		let response = {};
		await conn.end();
		if(!success) return _.extend({},serviceCode[3004]);
		return _.extend(response,serviceCode[2000]);
	};
};


exports = module.exports = terminalService;
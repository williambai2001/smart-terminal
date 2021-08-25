const _ = require('underscore');
const moment = require('moment');
const Sequelize = require('sequelize');
const DbMixin = require('../mixins/db.mixin');

module.exports = {
	name: 'terminal.record',
	settings: {

	},
	mixins:[DbMixin()],
	model:{
		name: 'test_0',
		define: {
			// id: Sequelize.INTEGER,
			loid: Sequelize.STRING,
			mac: Sequelize.STRING,
			time: Sequelize.INTEGER,
			create_time: Sequelize.INTEGER,
			update_time: Sequelize.INTEGER,
			online_time: Sequelize.INTEGER,
			status: Sequelize.INTEGER,
		},
		options: {

		},
	},
	actions: {
		createShardingTables:{
			
			// params:{
			// 	shardings: 'number',
			// },
			async handler(ctx){
				let shardings = process.env.TABLE_SHARDING || 64;
				let database = process.env.DB_DATABASE;
				let tablePrefix = process.env.TABLE_TERMINAL_PREFIX;
				let success = true;
				let tablePromises = [];
				for(let i=0;i<shardings;i++){
					let sql = this.getCreateTableSql(database,tablePrefix+i);
					tablePromises.push(this.adapter.db.query(sql));
				}
				try{
					await Promise.all(tablePromises);
				}catch(e){
					success = false;
				}
				return success;
			},
		},
		getTablePartitions: {
			params: {
				database: {
					type: 'string',
				},
				table: {
					type: 'string',
				},
			},
			async handler(ctx){
				let sql = this.getTablePartitionsSql(`${ctx.params.database}`,`${ctx.params.table}`);
				return this.adapter.db.query(sql)
					.then(([res,meta])=>JSON.stringify(_.pluck(res,'partition_name')));
			},

		},
		updateTablePartition: {


			async handler(ctx){
				let success = true;
				let tablePromises = [];
				//** database & table prefix
				let database = process.env.DB_DATABASE;
				let future_days = process.env.TABLE_PARTITION_FORWARD || 7;
				for(let i=0;i<64;i++){
					//** 表名
					let table = process.env.TABLE_TERMINAL_PREFIX + i;
					//** 获取分区表
					let sql = this.getTablePartitions(database,table);
					let [partitions,fields] = await this.adapter.db.query(sql);
					partitions = _.pluck(partitions||[],'partition_name');
					//** 是否未来一周的分区表名已经存在
					partitions = _.map(partitions,(p)=>{return p.replace(/p/g,'')});
					let weekdays = [];
					for(let i=0;i<future_days;i++){
						weekdays.push(moment().add(i,'day').format('YYYYMMDD'));
					}
					//** 过滤出当前需要增加的分区
					partitions = _.difference(weekdays,partitions);
					// console.log(partitions)
					let sql2 = this.getAddTablePartitionsSql(database,table,partitions);
					tablePromises.push(this.adapter.db.query(sql));
				}
				try{
					await Promise.all(tablePromises);
				}catch(e){
					if(options.verbose) console.error(e);
					success = false;
				}
				return success;
			},
		},
		getOne:{
			async handler(ctx){
				return this.adapter.db.query('SELECT * FROM test_0 LIMIT 10')
					.then(([res,meta])=>res);
			},
		},
		//** 更换表名
		renameTable:{
			async handler(ctx){
				let sql = this.getRenameTableSql('test','test_0','backup_0')
				return this.adapter.db.query(sql)
						.then();
			},
		},
	},

	methods: {
		getCreateTableSql: (database,table)=>{
			let today = moment().add(0,'day');
			let YYMMDD = today.format('YYYYMMDD');
			let timestamp = today.endOf('day').valueOf();
			return `CREATE TABLE ${database}.${table}(
				id bigint(20) NOT NULL AUTO_INCREMENT,
				loid varchar(50) NOT NULL DEFAULT "" COMMENT "光口号",
				mac varchar(50) NOT NULL DEFAULT "" COMMENT "网卡mac",
				time bigint(20) NOT NULL DEFAULT "0" COMMENT "上线/下线时间",
				create_time bigint(20) NOT NULL DEFAULT "0" COMMENT "创建时间",
				update_time bigint(20) NOT NULL DEFAULT "0" COMMENT "更新时间",
				online_status tinyint(1) NOT NULL DEFAULT "0" COMMENT "在线状态 默认1 0 离线 1 在线",
				status tinyint(1) NOT NULL DEFAULT "1" COMMENT "软删除标志:0-已删除;1-正常"',
			PRIMARY KEY (id,create_time),
			KEY select_index (loid,mac),
			KEY order_index (time,create_time,update_time)
			)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT="下挂终端上下线记录表"
			PARTITION BY RANGE(create_time)(PARTITION p ${YYMMDD} VALUES LESS THAN(${timestamp}))`;
		},

		getRenameTableSql: (database,tableOld,tableNew)=>{
			return `ALTER TABLE ${database}.${tableOld} RENAME TO ${database}.${tableNew}`;
		},

		getDropTableSql: (database,table)=>{
			return `DROP TABLE ${database}.${table}`;
		},

		getTablePartitionsSql: (database,table)=>{
			return `SELECT partition_name FROM INFORMATION_SCHEMA.PARTITIONS WHERE table_schema="${database}" and table_name="${table}"`;
		},

		getAddTablePartitionsSql: (database,table,partitions)=>{
			partitions = _.map(partitions,(p)=>{
				let date = moment(p.replace(/p/g,''),'YYYYMMDD').endOf('day').valueOf();
				return `PARTITION ${p} VALUES LESS THAN(${date})`;
			});
			let partitions_str = partitions.join(',');
			return `ALTER TABLE ${database}.${table} ADD PARTITION(${partitions_str})`;
		},

		getBackupTablePartitionSql: (database,table,partition,backup_path)=>{
			return `BACKUP DATABASE ${database}.${table} PARTITION(p${partition}) TO "${backup_path}" RATE_LIMIT=120MB/SECOND CONCURRENCY=8 CHECKSUM=FALSE`;
		},

		getDropTablePartitionSql: (database,table,partition)=>{
			return `ALTER TABLE ${database}.${table} DROP PARTITION ${partition}`;
		},

		getInsertSql: (database,table,keys,records)=>{
			let keys_str = keys.join(',');
			let values = _.map(records,function(record){
				return '("'+ record.join('","') + '")';
			});
			let values_str = values.join(',');
			return `INSERT INTO ${database}.${table} (${keys_str}) VALUES ${values_str}`;
		},

		getCountSql: (database,table,partition)=>{
			let partition_str = _.isUndefined(partition) ? '' : `PARTITION("${partition}")`;
			return `SELECT count(*) FROM ${database}.${table} ${partition_str}`;
		},

		getByLoidSql: (database,table,partition,loid)=>{
			let partition_str = _.isUndefined(partition) ? '' : `PARTITION("${partition}")`;
			return `SELECT * FROM ${database}.${table} ${partition_str} WHERE loid="${loid}"`;
		},
	},

};
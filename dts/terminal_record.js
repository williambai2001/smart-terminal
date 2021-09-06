let moment = require('moment');
let _ = require('underscore');

let terminalRecord = {};

//** 
terminalRecord.createTable = (database,table)=>{
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
	PARTITION BY RANGE(create_time)(PARTITION p ${YYMMDD} VALUES LESS THAN(${timestamp}))`.replace(/[\t|\n]/g,'');
	// let today = moment().add(0,'day');
	// let sql = ['CREATE TABLE',
	// 		'`' + database + '`.`' + table + '`',
	// 		'(',
	// 	  	[
	// 		  	'`id` bigint(20) NOT NULL AUTO_INCREMENT',
	// 		  	'`loid` varchar(50) NOT NULL DEFAULT "" COMMENT "光口号"',
	// 		  	'`mac` varchar(50) NOT NULL DEFAULT "" COMMENT "网卡mac"',
	// 		  	'`time` bigint(20) NOT NULL DEFAULT "0" COMMENT "上线/下线时间"',
	// 		  	'`create_time` bigint(20) NOT NULL DEFAULT "0" COMMENT "创建时间"',
	// 		  	'`update_time` bigint(20) NOT NULL DEFAULT "0" COMMENT "更新时间"',
	// 		  	'`online_status` tinyint(1) NOT NULL DEFAULT "0" COMMENT "在线状态 默认1 0 离线 1 在线"',
	// 		  	'`status` tinyint(1) NOT NULL DEFAULT "1" COMMENT "软删除标志:0-已删除;1-正常"',
	// 	  		'PRIMARY KEY (`id`,`create_time`)',
	// 			'KEY `select_index` (`loid`,`mac`)',
	// 			'KEY `order_index` (`time`,`create_time`,`update_time`)',
 //  			  ].join(','),
	// 		')',
	// 		'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT="下挂终端上下线记录表"',
	// 		'PARTITION BY RANGE(create_time)',
	// 		'(',
	// 		[
	// 			'PARTITION p'+ today.format('YYYY-MM-DD').replace(/-/g,'') +' VALUES LESS THAN('+ today.endOf('day').valueOf()+')',
	// 		].join(','),
	// 		')',
	// 	].join(' ');
	// return sql;
};

terminalRecord.renameTable = (database,tableOld,tableNew)=>{
	return `ALTER TABLE ${database}.${tableOld} RENAME TO ${database}.${tableNew}`;
	// let sql = ['ALTER TABLE',
	// 	'`' + `${database}` +'`.`'+ tableOld + '`',
	// 	'RENAME TO',
	// 	'`' + database + '`.`' + tableNew + '`',
	// 	].join(' ');
	// return sql;
};

terminalRecord.dropTable = (database,table)=>{
	return `DROP TABLE ${database}.${table}`;
	// let sql = ['DROP TABLE',
	// 	'`' + database + '`.`' + table + '`',
	// 	].join(' ');
	// return sql;
};

terminalRecord.getTablePartitions = (database,table)=>{
	return `SELECT partition_name FROM INFORMATION_SCHEMA.PARTITIONS WHERE table_schema="${database}" and table_name="${table}"`;
	// let sql = [
	// 	'SELECT partition_name FROM',
	// 	'INFORMATION_SCHEMA.PARTITIONS',
	// 	'WHERE',
	// 	'table_schema="' + database + '"',
	// 	'and',
	// 	'table_name="' + table + '"',
	// ].join(' ');
	// return sql;
};

terminalRecord.addTablePartitions = (database,table,partitions)=>{
	partitions = _.map(partitions,(p)=>{
		let date = moment(p.replace(/p/g,''),'YYYYMMDD').endOf('day').valueOf();
		return `PARTITION ${p} VALUES LESS THAN(${date})`;
	});
	let partitions_str = partitions.join(',');
	return `ALTER TABLE ${database}.${table} ADD PARTITION(${partitions_str})`;
	// let sql = [
	// 		'ALTER TABLE',
	// 		'`' + database +'`.`'+ table + '`',
	// 		'ADD PARTITION(',
	// 		_.map(partitions,(p)=>{
	// 			return ['PARTITION','p'+p,'VALUES LESS THAN(' + moment(p,'YYYYMMDD').endOf('day') + ')'].join(' ');
	// 		}).join(','),
	// 		')',
	// 	].join(' ');
	// return sql;
};

terminalRecord.backupTablePartition = (database,table,partition,backup_path)=>{
	return `BACKUP DATABASE ${database}.${table} PARTITION(p${partition}) TO "${backup_path}" RATE_LIMIT=120MB/SECOND CONCURRENCY=8 CHECKSUM=FALSE`;
	//    	let sql = [
	// 		'BACKUP DATABASE',
	// 		'`' + database +'`.`'+ table + '`',
	// 		'PARTITION(' + 'p' + partition + ')',
	// 		'TO',
	// 		'"' + backup_path + '"',
	// 		'RATE_LIMIT=120MB/SECOND',
	// 		'CONCURRENCY=8',
	// 		'CHECKSUM=FALSE',
	// 	].join(' ');
	// return sql;
};

terminalRecord.dropTablePartition = (database,table,partition)=>{
	return `ALTER TABLE ${database}.${table} DROP PARTITION ${partition}`;
	// let sql = [
	// 		'ALTER TABLE',
	// 		'`' + database +'`.`'+ table + '`',
	// 		'DROP PARTITION',
	// 		partition,
	// 	].join(' ');
	// return sql;
};

terminalRecord.insert = (database,table,keys,records)=>{
	let keys_str = keys.join(',');
	let values = _.map(records,function(record){
		return '("'+ record.join('","') + '")';
	});
	let values_str = values.join(',');
	return `INSERT INTO ${database}.${table} (${keys_str}) VALUES ${values_str}`;
	// let values = _.map(records,function(record){
	// 	return '("'+ record.join('","') + '")';
	// });
	// let sql = ['INSERT INTO',
	// 		'`' + database + '`.`'+ table + '`',
	// 		'(' + keys.join(',') + ')',
	// 		'VALUES',
	// 		values.join(','),
	// 	].join(' ');
	// return sql;
};

terminalRecord.count = (database,table,partition)=>{
	let partition_str = _.isUndefined(partition) ? '' : `PARTITION("${partition}")`;
	return `SELECT count(*) FROM ${database}.${table} ${partition_str}`;
	// let sql = [
	// 		'SELECT count(*) FROM',
	// 		'`' + database +'`.`'+ table + '`',
	// 		_.isUndefined(partition) ? '' : 'PARTITION(' + partition + ')',
	// 	].join(' ');
	// return sql;
};

terminalRecord.getByLoid = (database,table,partition,loid)=>{
	let partition_str = _.isUndefined(partition) ? '' : `PARTITION("${partition}")`;
	return `SELECT * FROM ${database}.${table} ${partition_str} WHERE loid="${loid}"`;
	// let sql = [
	// 		'SELECT * FROM',
	// 		'`' + database +'`.`'+ table + '`',
	// 		_.isUndefined(partition) ? '' : 'PARTITION(' + partition + ')',
	// 		'WHERE loid="' + loid + '"',
	// 	].join(' ');
	// return sql;
};


exports = module.exports = terminalRecord;
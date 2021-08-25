const should = require('should');
const _ = require('underscore');
const path = require('path');
const terminalRecordDTS = require('../../service/terminal.record.service').methods;

describe('[表]terminal_record：\n',()=>{
	it('.getCreateTableSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let sql = terminalRecordDTS.getCreateTableSql(database,table);
		console.log(sql);
	});

	it('.getRenameTableSql()',()=>{
		let database = 'test';
		let tableOld = 'test_1';
		let tableNew = 'backup_1';
		let sql = terminalRecordDTS.getRenameTableSql(database,tableOld,tableNew);
		console.log(sql);		
	});

	it('.getDropTableSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let sql = terminalRecordDTS.getDropTableSql(database,table);
		console.log(sql);		
	});

	it('.getTablePartitionsSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let sql = terminalRecordDTS.getTablePartitionsSql(database,table);
		console.log(sql);		
	});

	it('.getAddTablePartitionsSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let partitons = ['p20210701','p20210702'];
		let sql = terminalRecordDTS.getAddTablePartitionsSql(database,table,partitons);
		console.log(sql);		
	});

	it('.getBackupTablePartitionSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let date = '20210701';
		let backup_path = 'local:///tmp';
		let sql = terminalRecordDTS.getBackupTablePartitionSql(database,table,date,backup_path);
		console.log(sql);
	});

	it('.getDropTablePartitionSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let date = 'p20210701';
		let sql = terminalRecordDTS.getDropTablePartitionSql(database,table,date);
		console.log(sql);
	});

	it('.getInsertSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let keys = ['key1','key2'];
		let records = [
			{key1:'value11',key2:'value12'},
			{key1:'value12',key2:'value22'},			
		];
		records = _.map(records,(record)=>{
			return _.map(keys,(key)=>{
				return record[key];
			});
		});
		let sql = terminalRecordDTS.getInsertSql(database,table,keys,records);
		console.log(sql);
	});

	it('.getCountSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let partition = 'p20210701';
		let sql = terminalRecordDTS.getCountSql(database,table,partition);
		console.log(sql);
	});

	it('.getByLoidSql()',()=>{
		let database = 'test';
		let table = 'test_1';
		let partition = 'p20210701';
		let loid = 'loid00000000';
		let sql = terminalRecordDTS.getByLoidSql(database,table,partition,loid);
		console.log(sql);
	});

});
const should = require('should');
const _ = require('underscore');
const path = require('path');

const terminalRecordDTS = require('../../dts/terminal_record');

describe('[表]terminal_record：\n',()=>{
	it('.createTable()',()=>{
		let database = 'test';
		let table = 'test_1';
		let sql = terminalRecordDTS.createTable(database,table);
		console.log(sql);
	});

	it('.renameTable()',()=>{
		let database = 'test';
		let tableOld = 'test_1';
		let tableNew = 'backup_1';
		let sql = terminalRecordDTS.renameTable(database,tableOld,tableNew);
		console.log(sql);		
	});

	it('.dropTable()',()=>{
		let database = 'test';
		let table = 'test_1';
		let sql = terminalRecordDTS.dropTable(database,table);
		console.log(sql);		
	});

	it('.getTablePartitions()',()=>{
		let database = 'test';
		let table = 'test_1';
		let sql = terminalRecordDTS.getTablePartitions(database,table);
		console.log(sql);		
	});

	it('.addTablePartitions()',()=>{
		let database = 'test';
		let table = 'test_1';
		let partitions = ['p20210701','p20210702'];
		let sql = terminalRecordDTS.addTablePartitions(database,table,partitions);
		console.log(sql);		
	});

	it('.backupTablePartition()',()=>{
		let database = 'test';
		let table = 'test_1';
		let date = '20210701';
		let backup_path = 'local:///tmp';
		let sql = terminalRecordDTS.backupTablePartition(database,table,date,backup_path);
		console.log(sql);
	});

	it('.dropTablePartition()',()=>{
		let database = 'test';
		let table = 'test_1';
		let date = 'p20210701';
		let sql = terminalRecordDTS.dropTablePartition(database,table,date);
		console.log(sql);
	});

	it('.insert()',()=>{
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
		let sql = terminalRecordDTS.insert(database,table,keys,records);
		console.log(sql);
	});

	it('.count()',()=>{
		let database = 'test';
		let table = 'test_1';
		let partition = 'p20210701';
		let sql = terminalRecordDTS.count(database,table,partition);
		console.log(sql);
	});

	it('.getByLoid()',()=>{
		let database = 'test';
		let table = 'test_1';
		let partition = 'p20210701';
		let loid = 'loid00000000';
		let sql = terminalRecordDTS.getByLoid(database,table,partition,loid);
		console.log(sql);
	});

});
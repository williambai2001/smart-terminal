const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const program = require('vorpal')();

const terminalService = require('../service/terminalService');

//** 默认配置文件
const config_file = path.join(__dirname,'..','.env');
if(!fs.existsSync(config_file)){
	fs.writeFileSync(config_file,fs.readFileSync(path.join(__dirname,'..','config.env.sample'),'utf8'), 'utf8');
}
//** 配置文件存入process.env中
const configed = require('dotenv').config();


program
  .command('env', '查看process.env信息')
  .action(function(args, callback) {
    this.log(process.env);
    callback();
  });

//** 创建sharding多表
program
	.command('create schema')
	.description('创建下挂终端数据库上下线历史记录，分区多表')
	.option('-v,--verbose','输出详细信息')
	.action(async function(args){
		if(args.options.verbose) console.log(args);
		console.time();
		// if(_.isUndefined(options.table)){
		// 	console.log('缺少参数：--table');
		// 	return this.help();
		// }
		let result;
		result = await terminalService.createShardingTables(args.options);
		result && console.table(result);
		console.timeEnd();
	});

//** 获取分区表信息
program
	.command('get partition <database> <table>')
	.description('获取分区表名称')
	.option('-v,--verbose','输出详细信息')
	.option('-s,--sync','是否同步执行，同步执行会较慢')
	.option('-d,--database <name>','数据库名称')
	.option('-t,--table <name>','表名称')
	.action(async (args)=>{
		if(args.options.verbose) console.log(args);
		console.time();
		let result = await terminalService.getTablePartitions(args.database,args.table,args.options);
		console.table(result);
		console.timeEnd();
	});

//** 更新分区表信息
program
	.command('add partitions')
	.description('新增和更新分区表信息')
	.option('-v,--verbose','输出详细信息')
	.option('-a,--auto','自动新增未来七天的分区表')
	.option('-p,--partition','新增未来七天的分区表')
	.action(async (args)=>{
		if(!args.options.partition) return console.info('缺失 --partition');
		if(args.options.verbose) console.log(args);
		let interval = setInterval(()=>{
			process.stdout.write('.');
		},1000);
		console.time();
		let result;
		if(options.auto){
			result = await terminalService.updateTablePartition(args.options);
		}else if(options.partition){
			result = await terminalService.updateTablePartition(args.options);
		}else{
			return program.help();
		}
		result && console.table(result);
		await clearInterval(interval);
		console.timeEnd();
	});


//** 更改表名
program
	.command('rename table')
	.description('(Depreciated)将活动分区多表名称变更为备份离线分区多表名称')
	.option('-v,--verbose','输出详细信息')
	.action(async function(args){
		console.time();
		let result;
		result = await terminalService.renameShardingTables(args.options);
		result && console.table(result);
		console.timeEnd();
	});

//** 备份旧表
program
	.command('backup partition')
	.description('备份已离线分区多表数据')
	.option('-v,--verbose','输出详细信息')
	.action(function(args){

	});

//** 移除旧表数据，释放磁盘空间
program
	.command('drop partition')
	.description('移除已过期分区多表数据，释放磁盘空间')
	.option('-v,--verbose','输出详细信息')
	.option('-a,--auto','根据保留分区最大天数设置，自动移除过期分区')
	.option('-p,--partition <partition>','移除指定分区')
	.action(async function(args){
		console.time();
		let interval = setInterval(()=>{
			process.stdout.write('.');
		},1000);
		let result;
		if(args.options.auto){
			result = await terminalService.dropTablePartitonsAuto(args.options);
		}else if(args.options.partition){
			result = await terminalService.dropTablePartitions(args.options.partition,args.options);
		}else{
			return program.help();
		}
		result && console.table(result);
		await clearInterval(interval);
		console.timeEnd();
	});

program
  .delimiter('smart.terminal.db$')
  .show();


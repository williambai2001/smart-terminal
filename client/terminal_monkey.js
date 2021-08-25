const _ = require('underscore');
const program = require('commander');
const dotenv = require('dotenv').config();
const terminalService = require('../service/terminalService');

// const options = {
// 	verbose: false, //** 输出详细信息
// 	sync: false,//** 并行|串行运行
// 	countPerTrans: 2, //** 每次提交中含有交易的记录数量
// };

program
	.version('1.0')
	.description('插入测试数据，仅限于banchmark')
	.option('-v,--verbose','详细输出')
	.option('-s,--sync','并行|串行运行')
	.option('-c,--count-per-trans <number>','每次插入数据的个数，默认1')
	.action((options)=>{
		options = _.extend(program.opts,options);
		options.countPerTrans = options.countPerTrans || 1;
		console.log('命令行:\n',process.argv.join(' '),'\n');
		terminalService
			.addRecordRandom(0,64,5000000,options)
			.then(function(){
				console.log('finished.')
			})
			.catch(console.error);

	});

program.parse(process.argv);


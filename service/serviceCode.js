/**
 * 服务返回代码表
 * @type {Object}
 */
const serviceCode = {	
};

//** 返回正确
serviceCode[2000] = {
	code: 2000,
	message: 'ok',
};

//** 未知错误
serviceCode[9999] = {
	code: 9999,
	message: 'unknown error.',
};

//** 输入参数
serviceCode[4001] ={
	code: 4001,
	message: 'input parameter error.',
};

//** 创建分区表错误
serviceCode[3001] = {
	code: 3001,
	message: 'create sharding table error.',
};

//** sharding重命名错误
serviceCode[3002] = {
	code: 3002,
	messasge: 'rename sharding table error.',
};
//** 移除已备份分区错误
serviceCode[3003] = {
	code: 3003,
	messasge: 'drop sharding table error.',
};

//** 批量插入数据，性能测试用
serviceCode[3004] = {
	code: 3004,
	messasge: 'insert demo data error.',
};

//** 获取分区表数据
serviceCode[3005] = {
	code: 3005,
	messasge: 'get table partitions error.',
};

exports = module.exports = serviceCode;
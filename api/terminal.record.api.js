const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const {ServiceBroker} = require('moleculer');
const ApiService = require('moleculer-web');

//** 默认配置文件
const config_file = path.join(__dirname,'..','.env');
if(!fs.existsSync(config_file)){
	fs.writeFileSync(config_file,fs.readFileSync(path.join(__dirname,'..','config.env.sample'),'utf8'), 'utf8');
}
//** 配置文件存入process.env中
const configed = require('dotenv').config();

const broker = new ServiceBroker({
	replDelimiter: 'smart$',
});

//** load services
broker.loadService(path.join(__dirname, "..","service","terminal.record.service"));

broker.createService({
	mixins: [ApiService],
	settings: {
		routes: [
			{
				whitelist:[
					'**',
				],
			},
		],
	},
});

broker.start().then(()=>broker.repl());
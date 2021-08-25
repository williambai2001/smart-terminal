### 概要

该项目用于下挂终端运维。

本方案部署考虑免维护的方案。

解决思路：按日期分区，再按先进先出原则定时执行cron job，在增加新日期的数据后，移除若干天之前的分区数据（分区移除效率高）。

原方案日常流程：停下挂终端服务 => 更换表名 => 备份表数据 => 移除备份数据。

替代方案日常流程：创建日期分区 => 备份表分区数据 => 移除已备份分区数据。

#### 最佳实践

1 初始化数据表schema结构；

`
bin/smart terminal db init 
`

2 修改配置信息

`
bin/smart terminal db edit-config
`

3 启动/设置crontab

参考crontab.sample。

每天定时任务主要做两件事：

首先，要保证创建分区(partition)不能滞后。当前策略为：通过预先创建好未来数天的分区，保证当时间到达时，分区一定存在。这个参数是由TABLE_PARTITION_FORWARD设置的；
其次，根据先进先出原则，定时移除最早的一个分区。当前策略为：当前分区总数超过TOTAL时（TOTAL = TABLE_PARTITION_FORWARD + TABLE_PARTITION_MAX），移除最早的一个分区。

`
crontab crontab
`


4 全量备份数据

(手动)每周备份一次：

`
sudo su tidb
bin/smart terminal db backup snapshot
`

注意：上述备份命令在tidb用户下执行(sudo su tidb)，否则会出现"权限不允许"的故障。


(自动)每周全量备份一次(不推荐使用)：

修改crontab文件。

#### 安装

>安装 NodeJS>=v14

>执行 npm install

chmod 755 -R ./bin

#### 运行模拟数据

npm run monkey


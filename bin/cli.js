#! /usr/bin/env node

const program = require('commander');
const figlet = require('figlet');
const chalk = require('chalk');


program
  .command('create <app-name>')
  .description('创建一个新项目')
  .option('-f, --force', '覆盖目标目录（如果存在）') // 是否强制创建，当文件夹已经存在
  .action((name, options) => {
    // 在 create.js 中执行创建任务
    require('../lib/create.js')(name, options)
  })

program
  .command('deploy')
  .description('打包部署项目')
  .action(() => {
    // 部署项目
    require('../lib/deploy.js')()
  })

program
  // 配置版本号信息
  .version(`v${require('../package.json').version}`)
  .usage('<command> [option]')

program
  .on('--help', () => {
    console.log('\r\n' + figlet.textSync('yuzhenlin', {
      font: 'Ghost',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 120,
      whitespaceBreak: true
    }));
    console.log(`\r\n执行 ${chalk.cyan(`yzl <command> --help`)} 获取给定命令的详细用法\r\n`)
  })

// 解析用户执行命令传入参数
program.parse(process.argv);
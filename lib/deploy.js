const path = require('path')

// fs-extra 是对 fs 模块的扩展，支持 promise 语法
const fs = require('fs-extra')
const childProcess = require('child_process');
const ora = require('ora');
const node_ssh = require('node-ssh');
const archiver = require('archiver');
const inquirer = require('inquirer')
const {
  successLog,
  errorLog,
  underlineLog
} = require('../utils/logs');

module.exports = async function () {
  // 生成ssh实例
  let ssh = new node_ssh();

  // 当前命令行选择的目录
  const projectDir = process.cwd();

  // 项目打包命令
  let {
    script
  } = await inquirer.prompt({
    type: 'string',
    message: '请输入项目打包命令',
    default: 'npm run build',
    name: 'script',
  })

  // 项目打包目录
  let {
    distPath
  } = await inquirer.prompt({
    type: 'string',
    message: '请输入当前项目打包目录',
    default: './dist',
    name: 'distPath',
  })

  // 服务器配置
  let config = await inquirer.prompt([{
    type: 'string',
    message: '请输入服务器ip地址',
    name: 'host',
    validate: function(v){
      var done = this.async();
      setTimeout(function() {
        if(!v){
          done('请输入服务器ip地址')
        }
        done(null, true);
      }, 0);
    }
  }, {
    type: 'string',
    message: '请输入服务器端口号',
    default: '22',
    name: 'port',
  }, {
    type: 'string',
    message: '请输入服务器用户名',
    default: 'root',
    name: 'username',
  }, {
    type: 'string',
    message: '请输入服务器密码',
    name: 'password',
    validate: function(v){
      var done = this.async();
      setTimeout(function() {
        if(!v){
          done('请输入服务器密码')
        }
        done(null, true);
      }, 0);
    }
  }])

  // 服务器部署web目录
  let {
    webDir
  } = await inquirer.prompt({
    type: 'string',
    message: '请输入服务器部署web目录',
    default: '/root/www',
    name: 'webDir',
  })

  try {
    execBuild(script);
    await startZip(distPath);
    await connectSSH(config);
    await uploadFile(webDir);
    await unzipFile(webDir);
    await deleteLocalZip();
    successLog(`\n 恭喜您，部署成功了^_^\n`);
    process.exit(0);
  } catch (err) {
    errorLog(`  部署失败 ${err}`);
    process.exit(1);
  }

  // 第一步，执行打包脚本
  function execBuild(script) {
    try {
      console.log(`\n（1）${script}`);
      const spinner = ora('正在打包中');
      spinner.start();
      console.log();
      childProcess.execSync(script, {
        cwd: projectDir
      });
      spinner.stop();
      successLog('  打包成功');
    } catch (err) {
      errorLog(err);
      process.exit(1);
    }
  }

  // 第二部，打包zip
  function startZip(distPath) {
    return new Promise((resolve, reject) => {
      distPath = path.resolve(projectDir, distPath);
      const archive = archiver('zip', {
        zlib: {
          level: 9
        },
      }).on('error', err => {
        throw err;
      });
      const output = fs.createWriteStream(`${projectDir}/dist.zip`);
      output.on('close', err => {
        if (err) {
          errorLog(`  关闭archiver异常 ${err}`);
          reject(err);
          process.exit(1);
        }
        successLog('  zip打包成功');
        resolve();
      });
      archive.pipe(output);
      archive.directory(distPath, '/');
      archive.finalize();
    });
  }

  // 第三步，连接SSH
  async function connectSSH(config) {
    const {
      host,
      port,
      username,
      password
    } = config;
    const sshConfig = {
      host,
      port,
      username,
      password
    };
    try {
      console.log(`（3）连接${underlineLog(host)}`);
      await ssh.connect(sshConfig);
      successLog('  SSH连接成功');
    } catch (err) {
      errorLog(`  连接失败 ${err}`);
      process.exit(1);
    }
  }

  // 第四部，上传zip包
  async function uploadFile(webDir) {
    try {
      console.log(`（4）上传zip至服务器目录${webDir}`);
      await ssh.putFile(`${projectDir}/dist.zip`, `${webDir}/dist.zip`);
      successLog('  zip包上传成功');
    } catch (err) {
      errorLog(`  zip包上传失败 ${err}`);
      process.exit(1);
    }
  }


  // 运行命令
  async function runCommand(command, webDir) {
    await ssh.execCommand(command, {
      cwd: webDir
    });
  }

  // 第五步，解压zip包
  async function unzipFile(webDir) {
    try {
      console.log('（5）开始解压zip包');
      await runCommand(`cd ${webDir}`, webDir);
      await runCommand('unzip -o dist.zip && rm -f dist.zip', webDir);
      successLog('  zip包解压成功');
    } catch (err) {
      errorLog(`  zip包解压失败 ${err}`);
      process.exit(1);
    }
  }

  // 第六步，删除本地dist.zip包
  async function deleteLocalZip() {
    return new Promise((resolve, reject) => {
      console.log('（6）开始删除本地zip包');
      fs.unlink(`${projectDir}/dist.zip`, err => {
        if (err) {
          errorLog(`  本地zip包删除失败 ${err}`, err);
          reject(err);
          process.exit(1);
        }
        successLog('  本地zip包删除成功\n');
        resolve();
      });
    });
  }

}
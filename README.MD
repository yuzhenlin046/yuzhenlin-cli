## 轻量级前端脚手架

实现通过命令行完成项目模板创建和项目打包自动部署功能

### 安装

```
# install it globally
npm install -g yuzhenlin-cli
# or yarn
yarn global add yuzhenlin-cli
```

### 使用 

#### 项目模板指令

```
yzl create <name> [-f|--force]
```

- `-f, --force`: Overwrite if the target exists

#### 项目打包自动部署

部署前提条件要有一台云服务器配置了如nginx的web服务

脚手架需要配置服务器ip,服务器端口，用户名，密码来完成ssh连接

```
yzl deploy
```



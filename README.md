# cms-net

> 有调CMS渲染器系统

## Build Setup

``` bash
# 安装依赖
npm install

# 创建日志目录
mkdir logs

# 启动server 相当于执行：pm2 start cms-net.js 先使用fork模式，若使用集群模式的话（ -i max）和log4js有冲突
# https://github.com/nomiddlename/log4js-node/issues/265
npm start

# 跑单元测试
npm test
```

## 目录结构

  config           -- 存放项目所有的配置文件

  shell            -- sql脚本、shell脚本

  logs             -- 生产环境下的log

  src              -- 源码

  src/db           -- 数据库访问工具类。供业务逻辑相关类进行调用

  src/parser       -- markdown解析器

  src/crawler      -- 老CMS数据倒入新库的程序

  src/render       -- 所有渲染器

  src/api          -- 所有接口

  src/service      -- 业务逻辑

  utils            -- 工具类/方法存放处

  router.js        -- 路由配置

  moddleware.js    -- 中间件

  cms-net.js       -- 项目启动文件

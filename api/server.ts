import app from './app.js';
import { setConfig, isQCEnabled } from './config/appConfig.js';
import { initMysqlPool } from './config/mysql.js';

const args = process.argv.slice(2);
const argMap: Record<string, string> = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
    argMap[key] = value;
  }
}

const HOST = argMap.host || process.env.HOST || '0.0.0.0';
const PORT = parseInt(argMap.port || process.env.PORT || '3001', 10);

const mysqlHost = argMap['mysql-host'] || process.env.MYSQL_HOST || '';
const mysqlPort = parseInt(argMap['mysql-port'] || process.env.MYSQL_PORT || '3306', 10);
const mysqlUser = argMap['mysql-user'] || process.env.MYSQL_USER || '';
const mysqlPassword = argMap['mysql-password'] || process.env.MYSQL_PASSWORD || '';
const mysqlDatabase = argMap['mysql-db'] || process.env.MYSQL_DATABASE || '';

const mysqlEnabled = !!(mysqlHost && mysqlUser && mysqlPassword && mysqlDatabase);

setConfig({
  mysql: {
    enabled: mysqlEnabled,
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase,
  },
  qcModule: {
    enabled: mysqlEnabled,
  },
});

if (mysqlEnabled) {
  initMysqlPool();
}

const server = app.listen(PORT, HOST, () => {
  const baseUrl = `http://${HOST}:${PORT}`;
  console.log(`=====================================`);
  console.log(`  服务器已启动`);
  console.log(`=====================================`);
  console.log(`  服务地址: ${baseUrl}`);
  console.log(`  API基础路径: ${baseUrl}/api`);
  console.log(`=====================================`);
  console.log(`  模块状态:`);
  console.log(`    项目统计: 已启用`);
  console.log(`    标分质量: ${isQCEnabled() ? '已启用' : '未启用 (未配置MySQL)'}`);
  if (mysqlEnabled) {
    console.log(`  MySQL配置:`);
    console.log(`    主机: ${mysqlHost}:${mysqlPort}`);
    console.log(`    数据库: ${mysqlDatabase}`);
    console.log(`    用户: ${mysqlUser}`);
  } else {
    console.log(`  提示: 如需启用标分质量模块，请添加以下参数:`);
    console.log(`    --mysql-host <主机> --mysql-port <端口> --mysql-user <用户> --mysql-password <密码> --mysql-db <数据库>`);
  }
  console.log(`=====================================`);
  console.log(`  可用API接口:`);
  console.log(`    GET    ${baseUrl}/api/tasks          - 获取所有任务`);
  console.log(`    POST   ${baseUrl}/api/tasks          - 新增任务`);
  console.log(`    GET    ${baseUrl}/api/tasks/search   - 搜索任务`);
  console.log(`    PUT    ${baseUrl}/api/tasks/:id      - 更新任务`);
  console.log(`    DELETE ${baseUrl}/api/tasks/:id      - 删除任务`);
  console.log(`    GET    ${baseUrl}/api/statistics/person  - 按人员统计`);
  console.log(`    GET    ${baseUrl}/api/statistics/project - 按项目统计`);
  console.log(`    GET    ${baseUrl}/api/statistics/time    - 按时间统计`);
  if (isQCEnabled()) {
    console.log(`    GET    ${baseUrl}/api/qc                - 标分质量统计`);
  }
  console.log(`    GET    ${baseUrl}/api/config            - 获取配置信息`);
  console.log(`=====================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
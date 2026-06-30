# 项目统计系统

一个基于React + TypeScript + Node.js的项目统计与标分质量分析系统。

## 功能特性

### 项目统计模块
- **数据列表**：展示项目号、人员、个性化号、个性化内容、交付路径、消耗人时、任务交付时间等信息
- **多条件筛选**：支持按项目号、人员、个性化号等字段筛选，非实时刷新，需手动触发
- **任务数据导出**：支持导出为Excel(.xlsx)和CSV格式

### 统计分析模块
- **人员统计**：按人员统计任务数量和消耗人时，柱状图展示
- **项目统计**：按项目号统计任务数量和消耗人时，柱状图展示
- **时间统计**：按交付时间统计任务数量和消耗人时，柱状图展示
- **环比与同比分析**：支持月度、季度、半年、年度的环比和同比比较
- **年份选择**：支持选择不同年份进行对比
- **图表导出**：支持导出为PNG、JPEG、WebP格式
- **柱状图固定宽度**：确保图表美观一致

### 标分质量模块（可选）
- **CellRanger QC月度统计**：实时读取MySQL数据库进行分析
- **S1(V3.1)和S3(V4)分组统计**：按文库类型分开统计
- **QC规则校验**：
  - 预估细胞数校验（根据目标细胞数范围）
  - 8项附加QC指标校验（测序饱和度、Q30碱基率、转录组比对率等）
- **统计指标**：总样本数、通过数、失败数、通过率、按指标失败统计、按目标细胞数分组
- **数据导出**：支持查看总数据表

## 技术栈

### 前端
- React 19
- TypeScript
- Vite 6
- TailwindCSS 3
- Recharts（图表库）
- Lucide React（图标库）
- XLSX（Excel导出）
- Zustand（状态管理）

### 后端
- Node.js 20+
- Express 4
- TypeScript
- mysql2（MySQL连接）
- nodemon（开发热重载）

## 快速开始

### 环境要求
- Node.js >= 20
- npm >= 10

### 安装依赖

```bash
# 进入项目目录
cd Project_statistic

# 安装依赖
npm install
```

### 启动开发服务器

```bash
# 方式1：只启动后端（项目统计模块）
npm run server:dev -- --host 0.0.0.0 --port 3001

# 方式2：同时启动前端和后端（推荐）
npm run dev
```

### 启用标分质量模块

如需启用标分质量模块，需要提供MySQL数据库连接信息：

```bash
npm run server:dev -- --host 0.0.0.0 --port 3001 \
  --mysql-host <MySQL主机> \
  --mysql-port <MySQL端口> \
  --mysql-user <MySQL用户> \
  --mysql-password <MySQL密码> \
  --mysql-db <MySQL数据库名>
```

### 构建生产版本

```bash
npm run build
```

构建产物位于 `dist` 目录。

### 启动生产服务器

```bash
npm start -- --host 0.0.0.0 --port 3001
```

## API接口

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 获取所有任务 |
| POST | `/api/tasks` | 新增任务 |
| GET | `/api/tasks/search` | 搜索任务（支持筛选） |
| GET | `/api/tasks/:id` | 获取单个任务 |
| PUT | `/api/tasks/:id` | 更新任务 |
| DELETE | `/api/tasks/:id` | 删除任务 |

### 统计分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/statistics/person` | 按人员统计 |
| GET | `/api/statistics/project` | 按项目统计 |
| GET | `/api/statistics/time` | 按时间统计 |
| GET | `/api/statistics/time-comparison` | 环比同比分析 |

### 标分质量（需配置MySQL）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/qc` | 获取QC统计数据 |

### 系统信息

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/info` | 获取API地址和模块状态 |
| GET | `/api/health` | 健康检查 |

## 数据推送

系统支持通过脚本推送数据到系统中。

### Python脚本

```bash
# 查看帮助
python scripts/push_data.py --help

# 通过Excel文件推送数据
python scripts/push_data.py --file data.xlsx

# 通过命令行参数推送单条数据
python scripts/push_data.py \
  --project-number P001 \
  --person 张三 \
  --custom-number C001 \
  --custom-content 测试内容 \
  --delivery-path /docs/test \
  --hours 5 \
  --delivery-time 2024-01-01
```

### JavaScript脚本

```bash
# 查看帮助
node scripts/push_data.js --help

# 通过Excel文件推送数据
node scripts/push_data.js --file data.xlsx
```

## 配置说明

### 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--host` | 服务器绑定地址 | `0.0.0.0` |
| `--port` | 服务器端口 | `3001` |
| `--mysql-host` | MySQL主机地址 | 空（未启用） |
| `--mysql-port` | MySQL端口 | `3306` |
| `--mysql-user` | MySQL用户名 | 空（未启用） |
| `--mysql-password` | MySQL密码 | 空（未启用） |
| `--mysql-db` | MySQL数据库名 | 空（未启用） |

### 环境变量

| 变量名 | 说明 |
|--------|------|
| `HOST` | 服务器绑定地址 |
| `PORT` | 服务器端口 |
| `MYSQL_HOST` | MySQL主机地址 |
| `MYSQL_PORT` | MySQL端口 |
| `MYSQL_USER` | MySQL用户名 |
| `MYSQL_PASSWORD` | MySQL密码 |
| `MYSQL_DATABASE` | MySQL数据库名 |
| `NODE_ENV` | 运行环境（development/production） |

## 项目结构

```
Project_statistic/
├── api/                    # 后端代码
│   ├── config/            # 配置文件
│   │   ├── appConfig.ts   # 应用配置
│   │   └── mysql.ts       # MySQL连接配置
│   ├── data/              # 数据存储（JSON文件）
│   ├── routes/            # 路由定义
│   ├── services/          # 业务逻辑
│   ├── types/             # TypeScript类型定义
│   ├── app.ts             # Express应用
│   └── server.ts          # 服务器入口
├── src/                   # 前端代码
│   ├── api/               # API客户端
│   ├── components/        # 通用组件
│   ├── hooks/             # 自定义Hooks
│   ├── pages/             # 页面组件
│   ├── store/             # 状态管理
│   ├── types/             # TypeScript类型定义
│   ├── App.tsx            # 应用入口
│   ├── main.tsx           # React入口
│   └── index.css          # 全局样式
├── scripts/               # 数据推送脚本
├── public/                # 静态资源
├── dist/                  # 构建产物
└── package.json           # 项目配置
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 目录创建新页面组件
2. 在 `src/App.tsx` 中注册路由
3. 在 `src/components/Sidebar.tsx` 中添加导航菜单

### 添加新API接口

1. 在 `api/types/` 目录定义类型
2. 在 `api/services/` 目录创建服务层
3. 在 `api/routes/` 目录创建路由
4. 在 `api/app.ts` 中注册路由

## 部署说明

### 本地部署

```bash
# 构建
npm run build

# 启动
npm start -- --host 0.0.0.0 --port 3001
```

### 生产部署建议

1. 使用PM2进程管理：
   ```bash
   npm install -g pm2
   pm2 start npm -- start -- --host 0.0.0.0 --port 3001
   ```

2. 使用Nginx反向代理：
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

## 许可证

MIT License
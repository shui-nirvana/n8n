# Automation Platform

This project is a production-grade automation platform centered around n8n workflows, API integrations, and a React-based visualization dashboard.

## Architecture

- **n8n**: Workflow orchestration engine.
- **Backend**: Node.js/Express API handling authentication, logs, metrics, and n8n triggering.
- **Frontend**: React (Vite + MUI) dashboard for monitoring executions and metrics.
- **Database**: PostgreSQL storing logs, user data, and n8n internal data.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (for local development)

### Running with Docker (Recommended)

1. Copy `.env.example` to `.env` and configure secrets.
   ```bash
   cp .env.example .env
   ```
2. Start the stack:
   ```bash
   docker compose up -d
   ```
3. Access services:
   - **Frontend**: http://localhost:3000 (Login: admin / admin123)
   - **n8n Editor**: http://localhost:5678
   - **Backend API**: http://localhost:8080

### Local Development

**Backend**:

```bash
cd backend
npm install
npm start
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev
```

## Features

- **Auth**: JWT-based authentication with user management in PostgreSQL.
- **Visualization**: Real-time charts for success/failure rates.
- **Logs**: Centralized logging of workflow executions via database.
- **Integration**: REST APIs to trigger workflows and fetch status.

## Default Credentials

- **Platform Admin**: `admin` / `admin123`
- **n8n**: Setup required on first launch.

## License

MIT

前端仪表盘 http://localhost:3000 统一管理界面 admin / admin123 n8n 编辑器
http://localhost:5678 工作流编排 首次需设置管理员账号 后端 API
http://localhost:8080 核心接口服务

运行docker 程序

docker-compose up -d

如果修改后需要
docker-compose down
docker-compose up -d

docker-compose build --no-cache backend

docker-compose up -d --build backend frontend

1. 基础设施层 (Infrastructure Level)
   问题现象 (Symptom) 原因分析 (Root Cause) 解决方案 (Solution) Webhook 持续报 404 在排查初期，怀疑是 n8n 的队列模式 ( EXECUTIONS_MODE=queue ) 导致 Webhook 路由分发问题，或者是旧容器缓存。 1. 暂时切换到单机模式排查（验证并非模式本身问题）。
2. 最终发现是工作流配置问题（见下文），修复后 重新开启队列模式 并重启 Worker 容器。 PowerShell 报错 使用 curl 命令时报错 A positional parameter cannot be found 。PowerShell 中 curl 是 Invoke-WebRequest 的别名，参数不兼容。 改用 PowerShell 原生命令 Invoke-RestMethod 进行 API 测试。
3. 后端服务层 (Backend Service Level)
   问题现象 (Symptom) 原因分析 (Root Cause) 解决方案 (Solution) Authorization failed n8n 工作流中的 HTTP Request 节点尝试向后端 /api/logs 发送日志时，被后端的 authMiddleware 拦截。中间件要求所有 /api 路由必须携带 Bearer Token，但 n8n 内部调用未配置 Token。 修改 authMiddleware.js 代码，为 /logs 路径添加 白名单 ，允许跳过 Token 校验。
4. n8n 工作流配置层 (Workflow Level)
   这是问题最集中的地方，主要集中在 production-workflow.json 文件：

问题现象 (Symptom) 原因分析 (Root Cause) 解决方案 (Solution) Node Execution Error 工作流中使用了 n8n-nodes-base.postgres 节点，但环境中没有配置相应的 n8n Credentials，导致无法连接数据库。 移除 Postgres 节点 ，改用 HTTP Request 节点直接调用我们自己的后端 API ( http://backend:8080/api/logs ) 来存日志。 Webhook 404 Webhook 节点的 path 配置可能包含空格或不规范字符；或者节点名称与引用不匹配。 重写工作流 JSON，将 Webhook 路径规范化为 lead-signup ，并确保 Test URL 正确。 引用错误 下游节点尝试引用 $node["Webhook Trigger"] ，但实际节点名称被改为了 Webhook ，导致 Referenced node not found 。 统一节点名称为 Webhook ，并修正所有表达式引用为 $node["Webhook"] 。 节点版本过旧 HTTP Request 节点使用的是 Version 1，功能受限。 升级所有 HTTP Request 节点到 Version 3 。

### 最终架构状态

现在系统运行在完全的 Queue Mode 下，架构如下：

1. n8n Main (Core) : 接收外部 Webhook 请求 ( /webhook-test/lead-signup )，将任务推送到 Redis。
2. Redis : 充当任务消息队列。
3. n8n Worker : 从 Redis 获取任务并执行（包括运行 IF 判断、调用 HTTP Request）。
4. Backend API : 接收 n8n Worker 发来的日志请求，将其写入 Postgres 数据库。
5. Dashboard : 从后端读取并展示这些日志。
   现在的系统是健壮且通过测试的。

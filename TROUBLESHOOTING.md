# n8n 项目问题排查与修复总结

本文档记录了项目在配置 n8n 队列模式、Webhook 触发及后端集成过程中遇到的问题、原因分析及最终解决方案。

## 1. 基础设施层 (Infrastructure Level)

### Webhook 持续报 404

- **问题现象**: 请求 Webhook URL 时持续返回 404 错误。
- **原因分析**: 初期怀疑是 n8n 队列模式 (`EXECUTIONS_MODE=queue`) 导致的路由分发问题，或者是容器缓存问题。
- **解决方案**:
  1. 临时切换至单机模式排查（排除模式本身问题）。
  2. 最终确认是工作流配置问题（见下文），修复后**重新开启队列模式**并重启 `n8n_worker` 容器。

### PowerShell 命令报错

- **问题现象**: 使用 `curl` 时报错 `A positional parameter cannot be found`。
- **原因分析**: PowerShell 中 `curl` 是 `Invoke-WebRequest` 的别名，参数语法与 Linux curl 不兼容。
- **解决方案**: 改用 PowerShell 原生命令 `Invoke-RestMethod` 进行 API 测试。

---

## 2. 后端服务层 (Backend Service Level)

### Authorization failed (权限认证失败)

- **问题现象**: n8n 工作流报错 `Authorization failed`。
- **原因分析**: n8n 的 `HTTP Request` 节点向后端 `/api/logs` 发送日志时，被 `authMiddleware` 拦截。中间件默认要求 Bearer Token，但 n8n 内部调用未配置 Token。
- **解决方案**: 修改 `backend/src/middleware/authMiddleware.js`，为 `/logs` 路径添加**白名单**，允许跳过 Token 校验。

---

## 3. n8n 工作流配置层 (Workflow Level)

主要涉及 `production-workflow.json` 文件的修复：

### Node Execution Error (节点执行错误)

- **问题现象**: 节点报错，无法执行。
- **原因分析**: 工作流使用了 `n8n-nodes-base.postgres` 节点，但环境中未配置 n8n Credentials，导致无法连接数据库。
- **解决方案**: **移除 Postgres 节点**，改用 `HTTP Request` 节点直接调用后端 API (`http://backend:8080/api/logs`) 存储日志。

### Webhook 404

- **问题现象**: Webhook 路径无法访问。
- **原因分析**: Webhook 节点的 `path` 配置可能包含空格或特殊字符；节点名称与引用不匹配。
- **解决方案**: 重写工作流 JSON，规范化 Webhook 路径为 `lead-signup`，确保 Test URL 正确。

### 引用错误 (Reference Error)

- **问题现象**: 报错 `Referenced node not found`。
- **原因分析**: 下游节点引用 `$node["Webhook Trigger"]`，但实际节点名称被改为 `Webhook`。
- **解决方案**: 统一节点名称为 `Webhook`，并修正所有表达式引用为 `$node["Webhook"]`。

### 节点版本过旧

- **问题现象**: HTTP 请求功能受限。
- **原因分析**: `HTTP Request` 节点使用的是 Version 1。
- **解决方案**: 升级所有 `HTTP Request` 节点到 **Version 3**。

---

## 4. 最终架构状态 (Final Architecture)

系统目前运行在完全的 **Queue Mode** 下，数据流如下：

1. **n8n Main (Core)**
   - 接收外部 Webhook 请求 (`/webhook-test/lead-signup`)。
   - 将任务推送到 Redis 队列。

2. **Redis**
   - 充当任务消息队列，连接 Main 和 Worker。

3. **n8n Worker**
   - 从 Redis 获取任务并执行。
   - 执行逻辑包括：运行 IF 判断、调用 HTTP Request 发送日志。

4. **Backend API**
   - 接收 n8n Worker 发来的日志请求。
   - 将日志写入 Postgres 数据库。

5. **Dashboard**
   - 前端从后端 API 读取并展示这些日志。

---

_文档生成时间: 2026-01-29_

# 🏗 Rocket-Leaf 技术架构

本文档描述 Rocket-Leaf 项目的技术架构设计。

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Rocket-Leaf                          │
├─────────────────────────────────────────────────────────────┤
│                      Frontend (Vue 3)                       │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Views  │  │Components│  │ Stores  │  │   Services   │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └──────┬───────┘  │
│       └────────────┴─────────────┴───────────────┘          │
│                           │                                  │
│                     Wails Runtime                           │
│                           │                                  │
├───────────────────────────┼─────────────────────────────────┤
│                      Backend (Go)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Services  │  │    Models    │  │    Storage        │  │
│  └──────┬──────┘  └──────────────┘  └─────────┬─────────┘  │
│         │                                      │            │
│  ┌──────┴──────┐                      ┌───────┴─────────┐  │
│  │  RocketMQ   │                      │  SQLite/JSON    │  │
│  │   Client    │                      │                 │  │
│  └─────────────┘                      └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术选型

### 前端

| 技术       | 用途     | 理由                     |
| ---------- | -------- | ------------------------ |
| Vue 3      | UI 框架  | 渐进式框架，开发体验好   |
| TypeScript | 开发语言 | 类型安全，减少运行时错误 |
| Naive UI   | 组件库   | 美观现代，Vue 3 原生支持 |
| Pinia      | 状态管理 | Vue 3 官方推荐           |
| Vite       | 构建工具 | 极快的开发体验           |

### 后端

| 技术              | 用途      | 理由                     |
| ----------------- | --------- | ------------------------ |
| Go                | 开发语言  | 高性能，适合 Wails       |
| Wails 3           | 桌面框架  | 轻量、现代的桌面开发方案 |
| rocketmq-admin-go | MQ 客户端 | Go 原生 RocketMQ 管理库  |
| SQLite            | 本地存储  | 轻量级嵌入式数据库       |

---

## 目录结构设计

```
rocket-leaf/
├── build/                      # 构建配置与资源
│   ├── appicon.png             # 应用图标
│   ├── darwin/                 # macOS 配置
│   ├── windows/                # Windows 配置
│   └── linux/                  # Linux 配置
│
├── docs/                       # 项目文档
│   ├── ROADMAP.md              # 路线图
│   └── ARCHITECTURE.md         # 架构文档
│
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── assets/             # 静态资源
│   │   ├── components/         # 公共组件
│   │   │   ├── common/         # 通用组件
│   │   │   ├── layout/         # 布局组件
│   │   │   └── rocketmq/       # RocketMQ 相关组件
│   │   ├── views/              # 页面视图
│   │   │   ├── home/           # 首页
│   │   │   ├── topic/          # Topic 管理
│   │   │   ├── consumer/       # 消费者组
│   │   │   ├── message/        # 消息管理
│   │   │   └── monitor/        # 监控统计
│   │   ├── stores/             # Pinia 状态
│   │   │   ├── connection.ts   # 连接状态
│   │   │   ├── topic.ts        # Topic 状态
│   │   │   └── settings.ts     # 设置状态
│   │   ├── services/           # 服务层（调用 Go）
│   │   ├── router/             # 路由配置
│   │   ├── utils/              # 工具函数
│   │   ├── types/              # TypeScript 类型
│   │   ├── App.vue             # 根组件
│   │   └── main.ts             # 入口文件
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── internal/                   # Go 内部包
│   ├── rocketmq/               # RocketMQ 交互
│   │   ├── client.go           # 客户端封装
│   │   ├── topic.go            # Topic 操作
│   │   ├── consumer.go         # 消费者组操作
│   │   └── message.go          # 消息操作
│   ├── storage/                # 数据存储
│   │   ├── connection.go       # 连接配置存储
│   │   ├── settings.go         # 设置存储
│   │   └── crypto.go           # 加密工具
│   └── models/                 # 数据模型
│       ├── connection.go       # 连接模型
│       ├── topic.go            # Topic 模型
│       └── message.go          # 消息模型
│
├── services/                   # Wails 服务（暴露给前端）
│   ├── connection_service.go   # 连接服务
│   ├── topic_service.go        # Topic 服务
│   ├── consumer_service.go     # 消费者服务
│   ├── message_service.go      # 消息服务
│   └── monitor_service.go      # 监控服务
│
├── main.go                     # 应用入口
├── go.mod
├── go.sum
└── README.md
```

---

## 前后端通信

Wails 3 提供了前后端通信的机制：

### Go 服务暴露

```go
// services/connection_service.go
type ConnectionService struct {
    storage *storage.ConnectionStorage
}

// TestConnection 测试连接
func (s *ConnectionService) TestConnection(config ConnectionConfig) error {
    // ...
}

// GetConnections 获取所有连接
func (s *ConnectionService) GetConnections() ([]Connection, error) {
    // ...
}
```

### 前端调用

```typescript
// frontend/src/services/connection.ts
import { ConnectionService } from '@wailsio/runtime'

export async function testConnection(config: ConnectionConfig) {
  return await ConnectionService.TestConnection(config)
}
```

---

## 数据存储

### 连接配置

存储在本地 SQLite 数据库或 JSON 文件中：

```json
{
  "connections": [
    {
      "id": "uuid",
      "name": "生产环境",
      "nameservers": ["192.168.1.100:9876"],
      "accessKey": "encrypted_value",
      "secretKey": "encrypted_value",
      "timeout": 3000,
      "createdAt": "2026-02-07T12:00:00Z"
    }
  ]
}
```

### 敏感信息加密

使用 AES-256-GCM 加密敏感字段（AccessKey、SecretKey）。

---

## 主题系统

使用 CSS 变量实现主题切换：

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --accent-color: #18a058;
}

[data-theme='dark'] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #262626;
  --text-primary: #e0e0e0;
  --accent-color: #63e2b7;
}
```

---

## 安全考虑

1. **敏感数据加密** - AccessKey/SecretKey 本地加密存储
2. **本地运行** - 无需暴露管理端口到公网
3. **权限最小化** - 按需申请系统权限
4. **更新检查** - 支持安全更新通知

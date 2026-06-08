# 寓境 ECS 部署指南（阿里云）

> 适用：经济型 e 实例 2C2G + Docker Compose 部署后端 API  
> 小程序前端在本地/CI 构建后上传到微信公众平台，**不上传 ECS**。

---

## 一、整体架构

```
用户微信 ──► 微信小程序（微信托管）
                 │
                 │ HTTPS
                 ▼
            api.你的域名.com
                 │
            Nginx (443) ──► Koa2 :3000 ──► PostgreSQL
            （ECS 上）         （Docker）      （Docker）
```

ECS 只跑 **后端 + 数据库**。Admin 页挂在 `https://api.你的域名.com/admin`。

---

## 二、部署前准备

### 2.1 ECS 安全组（必开端口）

| 端口 | 用途 |
|------|------|
| 22 | SSH 登录 |
| 80 | HTTP（SSL 验证 / 跳转） |
| 443 | HTTPS API |

**不要**对公网开放 5432（PostgreSQL）、3000（建议只给 Nginx 本机反代）。

### 2.2 域名与备案

- 服务器在**国内**：域名需 **ICP 备案**，否则无法绑定 HTTPS 合法域名
- 微信小程序 `request 合法域名` 必须是 **HTTPS + 已备案域名**

### 2.3 本地准备

1. 代码已提交到 Git 仓库（GitHub / Gitee / 阿里云 Codeup 均可）
2. 或在本地打包后 SCP 上传（见下文方式 B）

---

## 三、把代码弄到 ECS 的两种方式

### 方式 A：Git 拉取（推荐）

**本地：**

```bash
cd d:\workspace\PM-prd
git add projects/yujing
git commit -m "add yujing mvp"
git push origin main
```

**ECS 上（SSH 登录后）：**

```bash
# 首次
ssh root@你的ECS公网IP

mkdir -p /opt/yujing && cd /opt/yujing
git clone https://你的仓库地址.git repo
cd repo/projects/yujing
```

后续更新只需：

```bash
cd /opt/yujing/repo
git pull
cd projects/yujing
docker compose up -d --build
```

---

### 方式 B：SCP 直接上传（无 Git 时）

**Windows PowerShell（在本机执行）：**

```powershell
# 只上传 yujing 目录（排除 node_modules）
scp -r d:\workspace\PM-prd\projects\yujing root@你的ECS公网IP:/opt/yujing/
```

或用 **rsync**（Git Bash / WSL）：

```bash
rsync -avz --exclude node_modules --exclude .env \
  /d/workspace/PM-prd/projects/yujing/ \
  root@你的ECS公网IP:/opt/yujing/
```

**ECS 上：**

```bash
ssh root@你的ECS公网IP
cd /opt/yujing
```

---

## 四、ECS 首次环境安装

SSH 登录 ECS 后执行：

```bash
# 1. 安装 Docker（官方脚本）
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 2. 验证
docker compose version

# 3. 可选：2G 机器建议加 swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 4. 进入项目目录（按你实际路径）
cd /opt/yujing/projects/yujing   # Git 方式
# 或 cd /opt/yujing              # SCP 方式
```

---

## 五、配置生产环境变量

```bash
cp .env.example .env
nano .env   # 或 vi .env
```

**生产必改项：**

```env
POSTGRES_PASSWORD=强密码随机字符串
NODE_ENV=production

VOLCENGINE_API_KEY=方舟控制台里的Key
VOLCENGINE_MODEL=ep-xxxxxxxx   # 推理接入点 ID

WECHAT_APPID=wx................
WECHAT_SECRET=................

ADMIN_API_KEY=强随机字符串
JWT_SECRET=另一个强随机字符串
```

保存后：

```bash
chmod 600 .env
```

---

## 六、启动服务

```bash
cd /opt/yujing/projects/yujing   # 项目根（含 docker-compose.yml）

# 构建并后台启动
docker compose up -d --build

# 查看状态
docker compose ps
docker compose logs -f server

# 首次：跑数据库迁移
docker compose exec server npm run migrate

# 可选：内测灌库（需 VOLCENGINE 已配置）
docker compose exec server npm run seed
```

验证 API：

```bash
curl http://127.0.0.1:3000/health
# 期望：{"ok":true,"service":"yujing-api"}
```

---

## 七、Nginx + HTTPS（阿里云面板一键 SSL）

### 7.1 安装 Nginx

```bash
# Alibaba Cloud Linux / CentOS
yum install -y nginx
# Ubuntu
# apt install -y nginx

systemctl enable nginx
```

### 7.2 域名解析

在域名 DNS 添加 **A 记录**：`api` → ECS 公网 IP

### 7.3 阿里云 SSL（方式 B：面板一键）

1. 轻量应用服务器 / ECS 控制台 → 域名 → 绑定域名
2. 申请免费 SSL 证书并开启 HTTPS
3. 若面板自动生成 Nginx 配置，需**手动补充 SSE 相关项**（见下）

### 7.4 Nginx 配置

创建 `/etc/nginx/conf.d/yujing.conf`（证书路径按面板实际填写）：

```nginx
server {
    listen 443 ssl http2;
    server_name api.你的域名.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 流式生成必须
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 120s;
        chunked_transfer_encoding on;
    }
}

server {
    listen 80;
    server_name api.你的域名.com;
    return 301 https://$host$request_uri;
}
```

```bash
nginx -t
systemctl reload nginx
```

外网验证：

```bash
curl https://api.你的域名.com/health
```

---

## 八、微信小程序对接

1. [微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 服务器域名  
2. **request 合法域名** 添加：`https://api.你的域名.com`  
3. 本地修改 `miniapp/src/config.js`：

```js
export const BASE_URL = 'https://api.你的域名.com';
```

4. 本地构建并上传：

```bash
cd miniapp
npm install
npm run build:mp-weixin
```

5. 微信开发者工具 → 导入 `miniapp/dist/build/mp-weixin` → 上传 → 提交审核

---

## 九、日常更新发布流程

```bash
# === ECS 上（后端）===
ssh root@你的ECS公网IP
cd /opt/yujing/repo && git pull
cd projects/yujing
docker compose up -d --build
docker compose exec server npm run migrate   # 有 schema 变更时

# === 本机（小程序，有前端改动时）===
cd miniapp
npm run build:mp-weixin
# 开发者工具上传新版本
```

---

## 十、常用运维命令

```bash
# 日志
docker compose logs -f server
docker compose logs -f postgres

# 重启
docker compose restart server

# 停止
docker compose down

# 停止并删数据卷（慎用！会清空数据库）
docker compose down -v

# Admin 页
# 浏览器打开 https://api.你的域名.com/admin
# 输入 .env 里的 ADMIN_API_KEY
```

---

## 十一、故障排查

| 现象 | 可能原因 |
|------|----------|
| 小程序 request 失败 | 域名未备案 / 未配合法域名 / 用了 http |
| SSE 生成卡住 | Nginx 未关 `proxy_buffering` |
| 502 Bad Gateway | `docker compose ps` 看 server 是否挂了 |
| 数据库连不上 | `.env` 密码与 compose 不一致；migrate 未跑 |
| OOM 重启 | 2G 内存不足，确认 swap 已开、PG 配置已生效 |

---

## 十二、安全提醒

- `.env` **不要提交 Git**，已在 `.gitignore`
- 生产 `POSTGRES_PASSWORD`、`ADMIN_API_KEY`、`JWT_SECRET` 用随机强密码
- 安全组不要开放 5432、3000 到 0.0.0.0/0
- 定期 `docker compose exec postgres pg_dump ...` 备份数据库

参考配置文件：`deploy/nginx.conf`

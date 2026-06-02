# ============================================================
# 乡村振兴创新服务平台 · 部署流程
# 复用 gongmei-digital 的 CI/CD 部署流程模式
# ============================================================

## 服务器端 systemd 服务配置

### 1. CVM 上创建 systemd 服务文件

```bash
sudo tee /etc/systemd/system/rural-revitalization.service << 'SERVICE_EOF'
[Unit]
Description=乡村振兴创新服务平台
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/rural-revitalization
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5001

[Install]
WantedBy=multi-user.target
SERVICE_EOF
```

### 2. 启用并启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable rural-revitalization
sudo systemctl start rural-revitalization
sudo systemctl status rural-revitalization --no-pager
```

### 3. Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name rr.hmctz.cn;  # 待确认域名

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量

所有敏感信息通过 GitHub Secrets 管理：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `S3_ENDPOINT_URL` / `S3_BUCKET_NAME` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
- `ZHIPU_API_KEY`
- `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY` / `DEPLOY_PATH`

## push 到 GitHub 后自动触发

提交到 main 分支后，GitHub Actions 会自动：
1. 拉取代码
2. 安装依赖 (`npm ci`)
3. 构建 (`npm run build`)
4. 通过 SCP 部署到 CVM
5. 重启 systemd 服务

## 注意事项

- CVM 上 GitHub SSH key 从未有效，实际通过 GITHUB_TOKEN 走 HTTPS
- 端口 5001（gongmei-digital 使用 5000）
- 服务名：`rural-revitalization`

#!/bin/bash
# 在 ECS 上首次部署：git clone 后执行 bash deploy/deploy-on-ecs.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "请编辑 .env 后重新运行此脚本"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

docker compose up -d --build
sleep 5
docker compose exec -T server npm run migrate

echo "部署完成。健康检查："
curl -s http://127.0.0.1:3000/health || true
echo ""
echo "Admin: http://你的域名/admin"

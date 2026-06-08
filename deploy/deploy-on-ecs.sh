#!/bin/bash
# 在 ECS 上首次部署：git clone 后执行 bash deploy/deploy-on-ecs.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "请编辑 .env 后重新运行此脚本"
  exit 1
fi

configure_docker_mirrors() {
  mkdir -p /etc/docker
  if [ ! -f /etc/docker/daemon.json ]; then
    cat >/etc/docker/daemon.json <<'JSON'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.1panel.live",
    "https://docker.m.daocloud.io",
    "https://hub-mirror.c.163.com"
  ]
}
JSON
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  if [ -f /etc/os-release ] && grep -q '^ID=alinux' /etc/os-release; then
    dnf install -y dnf-plugins-core
    dnf config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  else
    curl -fsSL https://get.docker.com | sh
  fi
  configure_docker_mirrors
  systemctl daemon-reload
  systemctl enable docker
  systemctl start docker
elif [ -d /etc/systemd/system ]; then
  configure_docker_mirrors
  systemctl restart docker
fi

docker compose up -d --build
sleep 5
docker compose exec -T server npm run migrate

echo "部署完成。健康检查："
curl -s http://127.0.0.1:3000/health || true
echo ""
echo "Admin: http://你的域名/admin"

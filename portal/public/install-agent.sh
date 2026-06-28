#!/bin/bash
set -e

# Colors for log output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;37m' # No Color
INFO='\033[0;36m'

echo -e "${INFO}=== VPS-WARD Linux Agent Installer ===${NC}"

# Check root privilege
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Lỗi: Vui lòng chạy script này với quyền root hoặc sử dụng sudo.${NC}"
  exit 1
fi

# Check token
if [ -z "$TOKEN" ]; then
  echo -e "${RED}Lỗi: Thiếu TOKEN xác thực. Vui lòng chạy lệnh cài đặt kèm TOKEN, ví dụ:${NC}"
  echo -e "${YELLOW}curl -sSL https://litsoftware.io.vn/install-agent.sh | TOKEN=\"your_token\" bash${NC}"
  exit 1
fi

# Detect OS architecture
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
  echo -e "${RED}Lỗi: VPS-WARD Agent hiện chỉ hỗ trợ kiến trúc x86_64 cho Linux. Kiến trúc hiện tại của bạn là: $ARCH${NC}"
  exit 1
fi

# Configuration
SERVER_HOST="litsoftware.io.vn"
BINARY_URL="https://${SERVER_HOST}/collector-linux-amd64"
INSTALL_PATH="/usr/local/bin/vpsward-agent"
SERVICE_NAME="vpsward-agent"

# Download binary
echo -e "${INFO}Đang tải xuống Agent từ: ${BINARY_URL}...${NC}"
# Dừng dịch vụ trước nếu đang chạy để tránh lỗi "Text file busy"
if systemctl is-active --quiet "$SERVICE_NAME"; then
  echo -e "${INFO}Đang tạm dừng dịch vụ cũ để cập nhật...${NC}"
  systemctl stop "$SERVICE_NAME" || true
fi
# Xóa file cũ để giải phóng inode
rm -f "$INSTALL_PATH"

curl -sSL -o "$INSTALL_PATH" "$BINARY_URL"
chmod +x "$INSTALL_PATH"

# Create systemd service
echo -e "${INFO}Đang tạo dịch vụ systemd cho Agent...${NC}"
cat <<EOF > /etc/systemd/system/${SERVICE_NAME}.service
[Unit]
Description=VPS-WARD Monitoring Agent
After=network.target

[Service]
Type=simple
ExecStart=${INSTALL_PATH} -server ${SERVER_HOST} -ssl -token ${TOKEN}
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=vpsward-agent

[Install]
WantedBy=multi-user.target
EOF

# Reload and start service
echo -e "${INFO}Đang khởi động dịch vụ ${SERVICE_NAME}...${NC}"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
  echo -e "${GREEN}Cài đặt thành công! Dịch vụ vpsward-agent đang hoạt động.${NC}"
  echo -e "${GREEN}Thiết bị của bạn sẽ hiển thị online trên Dashboard trong vài giây.${NC}"
else
  echo -e "${RED}Lỗi: Dịch vụ vpsward-agent đã được cài đặt nhưng không hoạt động. Vui lòng kiểm tra log bằng lệnh: journalctl -u vpsward-agent -n 50${NC}"
fi
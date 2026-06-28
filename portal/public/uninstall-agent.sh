#!/bin/bash
set -e

# Colors for log output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;37m' # No Color
INFO='\033[0;36m'

echo -e "${INFO}=== VPS-WARD Linux Agent Uninstaller ===${NC}"

# Check root privilege
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Lỗi: Vui lòng chạy script này với quyền root hoặc sử dụng sudo.${NC}"
  exit 1
fi

SERVICE_NAME="vpsward-agent"
INSTALL_PATH="/usr/local/bin/vpsward-agent"

# Stop service
if systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
  echo -e "${INFO}Đang dừng dịch vụ ${SERVICE_NAME}...${NC}"
  systemctl stop "$SERVICE_NAME" || true
  
  echo -e "${INFO}Đang vô hiệu hóa dịch vụ ${SERVICE_NAME}...${NC}"
  systemctl disable "$SERVICE_NAME" || true
  
  echo -e "${INFO}Đang xóa file cấu hình dịch vụ...${NC}"
  rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
  systemctl daemon-reload
else
  echo -e "${YELLOW}Cảnh báo: Không tìm thấy dịch vụ ${SERVICE_NAME}.${NC}"
fi

# Remove binary
if [ -f "$INSTALL_PATH" ]; then
  echo -e "${INFO}Đang xóa file thực thi Agent...${NC}"
  rm -f "$INSTALL_PATH"
else
  echo -e "${YELLOW}Cảnh báo: Không tìm thấy file thực thi tại ${INSTALL_PATH}.${NC}"
fi

echo -e "${GREEN}Gỡ cài đặt VPS-WARD Agent thành công!${NC}"

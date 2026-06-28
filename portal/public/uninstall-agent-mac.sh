#!/bin/bash
set -e

# Colors for log output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;37m' # No Color
INFO='\033[0;36m'

echo -e "${INFO}=== VPS-WARD macOS Agent Uninstaller ===${NC}"

PLIST_PATH="$HOME/Library/LaunchAgents/com.vpsward.agent.plist"
INSTALL_DIR="$HOME/.vpsward"

# Unload and remove LaunchAgent
if [ -f "$PLIST_PATH" ]; then
  echo -e "${INFO}Đang dừng và hủy đăng ký LaunchAgent...${NC}"
  launchctl unload "$PLIST_PATH" || true
  rm -f "$PLIST_PATH"
else
  echo -e "${YELLOW}Cảnh báo: Không tìm thấy file cấu hình LaunchAgent tại ${PLIST_PATH}.${NC}"
fi

# Remove install directory
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${INFO}Đang xóa thư mục cài đặt Agent tại ${INSTALL_DIR}...${NC}"
  rm -rf "$INSTALL_DIR"
else
  echo -e "${YELLOW}Cảnh báo: Không tìm thấy thư mục cài đặt tại ${INSTALL_DIR}.${NC}"
fi

echo -e "${GREEN}Gỡ cài đặt VPS-WARD Agent trên macOS thành công!${NC}"

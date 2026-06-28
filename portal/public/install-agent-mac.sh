#!/bin/bash
set -e

# Colors for log output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;37m' # No Color
INFO='\033[0;36m'

echo -e "${INFO}=== VPS-WARD macOS Agent Installer ===${NC}"

# Check token
if [ -z "$TOKEN" ]; then
  echo -e "${RED}Lỗi: Thiếu TOKEN xác thực. Vui lòng chạy lệnh cài đặt kèm TOKEN, ví dụ:${NC}"
  echo -e "${YELLOW}curl -sSL https://litsoftware.io.vn/install-agent-mac.sh | TOKEN=\"yo...\" bash${NC}"
  exit 1
fi

# Detect architecture (x86_64 vs arm64)
ARCH=$(uname -m)
BINARY_NAME="collector-darwin-amd64"
if [ "$ARCH" = "arm64" ]; then
  BINARY_NAME="collector-darwin-arm64"
  echo -e "${INFO}Phát hiện CPU Apple Silicon (arm64)${NC}"
else
  echo -e "${INFO}Phát hiện CPU Intel (x86_64)${NC}"
fi

# Configuration
SERVER_HOST="litsoftware.io.vn"
BINARY_URL="https://${SERVER_HOST}/${BINARY_NAME}"
INSTALL_DIR="$HOME/.vpsward"
INSTALL_PATH="${INSTALL_DIR}/vpsward-agent"
PLIST_PATH="$HOME/Library/LaunchAgents/com.vpsward.agent.plist"

# Create install directory
mkdir -p "$INSTALL_DIR"

# Download binary
echo -e "${INFO}Đang tải xuống Agent từ: ${BINARY_URL}...${NC}"
curl -sSL -o "$INSTALL_PATH" "$BINARY_URL"
chmod +x "$INSTALL_PATH"

# Create LaunchAgent plist
echo -e "${INFO}Đang tạo LaunchAgent cho Agent...${NC}"
cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.vpsward.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>${INSTALL_PATH}</string>
        <string>-server</string>
        <string>${SERVER_HOST}</string>
        <string>-ssl</string>
        <string>-token</string>
        <string>${TOKEN}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${INSTALL_DIR}/agent.log</string>
    <key>StandardErrorPath</key>
    <string>${INSTALL_DIR}/agent.err.log</string>
</dict>
</plist>
EOF

# Load and start LaunchAgent
echo -e "${INFO}Đang khởi động Agent thông qua launchctl...${NC}"
# Unload first if exists
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo -e "${GREEN}Cài đặt thành công! Dịch vụ vpsward-agent LaunchAgent đã được đăng ký và khởi chạy.${NC}"
echo -e "${GREEN}Thiết bị của bạn sẽ hiển thị online trên Dashboard trong vài giây.${NC}"
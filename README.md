# Claude Proxy

Proxy server chạy trên Termux, chuyển Claude Web thành API.

## Cài đặt

### 1. Clone repo
\```bash
pkg install git nodejs
git clone https://github.com/m93519925-netizen/claude-proxy.git
cd claude-proxy
npm install
\```

### 2. Tạo file .env
\```bash
cp .env.example .env
nano .env
\```
Điền SESSION_KEY và ORG_ID vào.

### 3. Cài zrok
\```bash
pkg install wget unzip
wget https://github.com/openziti/zrok/releases/latest/download/zrok_linux_arm64.tar.gz
tar -xzf zrok_linux_arm64.tar.gz
mv zrok /usr/local/bin/
zrok enable YOUR_ZROK_TOKEN
\```

### 4. Chạy server
\```bash
node server.js
\```

### 5. Expose qua zrok (terminal mới)
\```bash
zrok share public http://localhost:3000
\```

## Sử dụng

\```bash
curl -X POST "https://your-zrok-url/proxy" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Xin chào!", "model": "claude-sonnet-4-6"}'
\```

## Lấy SESSION_KEY

1. Mở claude.ai trên Chrome
2. F12 → Application → Cookies → claude.ai
3. Copy giá trị của `sessionKey`

## Lấy ORG_ID

Xem trong URL khi dùng claude.ai:
\`https://claude.ai/api/organizations/{ORG_ID}/...\`

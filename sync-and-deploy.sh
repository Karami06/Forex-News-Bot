#!/usr/bin/env bash
# -----------------------------------------------------------------
# اسکریپت همگام‌سازی امن از پروژه اصلی به بک‌آپ (برای گیت‌هاب)
# -----------------------------------------------------------------

SRC="D:/Projects/fxbot/Forex News Bot"
DEST="D:/Projects/fxbot/Forex News Bot_backup"

echo "Starting secure sync from $SRC to $DEST"

# 1. کپی فقط فایل‌های مجاز با robocopy (معادل rsync در ویندوز)
# /MIR = mirror (حذف فایل‌های اضافه در مقصد)
# /XD = exclude directories
# /XF = exclude files
robocopy "$SRC" "$DEST" /MIR /XD node_modules .wrangler .git .vscode .idea .mimocode /XF sync-and-deploy.sh create-release.sh setup.js test-callback.json .env .env.local Info.txt *.log > /dev/null

# 2. تولید wrangler.toml امن برای گیت‌هاب (با placeholderها)
cat > "$DEST/wrangler.toml" << 'EOF'
name = "forex-news-bot"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"

[triggers]
crons = ["*/5 * * * *"]

[vars]
TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
ADMIN_USER_IDS = "YOUR_ADMIN_USER_ID"
EOF

# 3. Commit و Push به گیت‌هاب
cd "$DEST" || exit 1
git add -A

MSG="Sync from main project – $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$MSG" || echo "No changes to commit"

# Push master به main در ریموت
git push origin master:main

echo "Secure sync and deploy completed."
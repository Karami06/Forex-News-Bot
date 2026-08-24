#!/usr/bin/env bash

# مسیرهای اصلی و مقصد
SRC="D:/Projects/fxbot/Forex News Bot"
DEST="D:/Projects/fxbot/Forex News Bot_backup"

echo "Starting sync from $SRC to $DEST"

# 1. همگام‌سازی با robocopy (بدون پوشه‌های بزرگ)
robocopy "$SRC" "$DEST" /MIR /XD node_modules .wrangler .git /XF sync-and-deploy.sh > /dev/null

# 2. حذف توکن حساس از wrangler.toml
if [ -f "$DEST/wrangler.toml" ]; then
  # فرض بر این است که توکن در فایلی با نام TELEGRAM_BOT_TOKEN قرار دارد یا در خود فایل کانفیگ است
  # استفاده از sed برای جایگزینی مقدار توکن با placeholder
  sed -i 's/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"/' "$DEST/wrangler.toml"
fi

# 3. Commit & push به GitHub
cd "$DEST" || exit 1
git add -A

# گرفتن پیام کامیت از آخرین تغییرات پروژه اصلی (اگر فایلی برای پیام وجود داشته باشد)
MSG="Sync from main project – $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$MSG" || echo "No changes to commit"

# پوش کردن به گیت‌هاب
git push origin main

echo "Sync and deploy completed."

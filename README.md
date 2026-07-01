# Forex News Bot

A professional Telegram bot that delivers economic news from Forex Factory to trading groups and individual users, powered by Cloudflare Workers.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Automated News Delivery** — Sends daily economic news to groups and private chats at scheduled times
- **Pre-Release Alerts** — Notifies users 5 minutes before high-impact news events
- **Multi-Language Support** — English, Persian, Arabic, Russian, Spanish, Chinese, Japanese
- **Per-Group Configuration** — Each group can have its own currency pairs, impact levels, timezone, and schedule
- **Interactive Admin Panel** — Inline button interface for all settings (no commands needed)
- **Market Sessions** — Real-time view of which markets are open/closed with local times
- **TradingView Integration** — Direct chart links for every news item
- **Strikethrough for Released News** — Past events shown with strikethrough in the news list
- **7 Languages** — Full localization for global users

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless runtime (free tier) |
| Cloudflare KV | Persistent configuration storage |
| Telegram Bot API | Messaging platform |
| Forex Factory | Economic news data source |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A [Cloudflare](https://dash.cloudflare.com/) account (free tier works)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/forex-news-bot.git
cd forex-news-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Telegram bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the bot token (looks like `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`)

### 4. Set up Cloudflare

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** > **KV** > **Create namespace**
3. Name it (e.g., `forex-news-bot-config`)
4. Copy the **Namespace ID**

### 5. Configure the bot

Edit `wrangler.toml` with your credentials:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"

[vars]
TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN"
ADMIN_USER_IDS = "YOUR_TELEGRAM_USER_ID"
```

> **Tip:** To find your Telegram user ID, message `@userinfobot` on Telegram.

### 6. Deploy

```bash
npm run deploy
```

Note the Worker URL from the output (e.g., `https://forex-news-bot.YOUR_SUBDOMAIN.workers.dev`).

### 7. Set the webhook

```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://YOUR_WORKER_URL/webhook"
```

### 8. Start using the bot

1. Open your bot in Telegram
2. Send `/start` to register
3. Use the inline buttons to configure settings

---

## Configuration

### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Register and show main menu |
| `/settings` | Open settings panel |
| `/sessions` | View market sessions |
| `/news today` | Preview today's news |
| `/news tomorrow` | Preview tomorrow's news |
| `/help` | Show all commands |

### Settings Panel

Access via `/settings` or the Settings button:

- **Currency Pairs** — Toggle which pairs to track (EURUSD, GBPUSD, USDJPY, etc.)
- **Currency Codes** — Filter by individual currencies (USD, EUR, GBP, JPY, etc.)
- **Impact Levels** — High, Medium, Low (toggle each)
- **Schedule** — Set automatic send times for today and tomorrow
- **Timezone** — Choose from 55+ timezones worldwide
- **Language** — Switch between 7 languages
- **Custom Events** — Subscribe to specific events (NFP, CPI, GDP, etc.)
- **Pre-Release Alerts** — Toggle 5-minute advance notifications

### Default Configuration

| Setting | Default |
|---------|---------|
| Currency Pairs | EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD |
| Impact Levels | High, Medium, Low |
| Timezone | Asia/Tehran (IRST, UTC+3:30) |
| Today's Send | 12:00 |
| Tomorrow's Send | 00:00 |
| Language | English |

---

## How It Works

1. **Scheduled Delivery** — A Cloudflare cron job runs every 5 minutes, checks each registered group's scheduled time, and sends the matching news
2. **Pre-Release Alerts** — The same cron checks for upcoming high-impact events and sends advance warnings
3. **News Data** — Fetched from Forex Factory's weekly JSON feed, cached in Cloudflare KV for 24 hours
4. **Per-Group Storage** — Each group's configuration is stored separately in Cloudflare KV

---

## Project Structure

```
forex-news-bot/
├── src/
│   └── index.js          # Main bot code (single file)
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Node.js dependencies
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

---

## Troubleshooting

### Bot not responding to messages
- Verify webhook is set: `curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"`
- Check that `TELEGRAM_BOT_TOKEN` is set in `wrangler.toml`
- Ensure the Worker is deployed: `npm run deploy`

### Automatic messages not sending
- Make sure you've sent `/start` to register
- Check your scheduled time in Settings
- Verify your timezone is set correctly

### Duplicate messages
- The bot uses minute-based deduplication — this is normal behavior if you see the same news at different times (pre-release alert + scheduled send)

### News not appearing
- The bot uses a cached feed — run `/refresh` to update
- Check that your currency and impact filters include the news you want

---

## Cost

This bot runs entirely on free tiers:

| Service | Free Tier Limit |
|---------|-----------------|
| Cloudflare Workers | 100,000 requests/day |
| Cloudflare KV | 100,000 reads/day, 1,000 writes/day |
| Telegram Bot API | Unlimited (rate limited) |
| Forex Factory | Free (public JSON feed) |

**Total: $0/month** for typical usage.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Forex Factory](https://www.forexfactory.com/) for the economic calendar data
- [Cloudflare](https://www.cloudflare.com/) for the serverless platform
- [Telegram](https://telegram.org/) for the Bot API

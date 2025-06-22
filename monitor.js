name: ESO Monitoring

on:
  schedule:
    - cron: '0 6 * * *'      # kasdien 06:00 UTC (08:00 Lietuvos laiku)
  workflow_dispatch:         # leidžia paleisti ranka iš Actions UI

jobs:
  check-eso:
    runs-on: ubuntu-latest
    env:
      ESO_ID:             71177586
      TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
      TELEGRAM_CHAT_ID:   ${{ secrets.TELEGRAM_CHAT_ID }}

    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Run monitoring script
        run: node monitor.js

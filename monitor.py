#!/usr/bin/env python3

import os
import requests
from bs4 import BeautifulSoup

# Konfigūruojama per aplinkos kintamuosius (GitHub Secrets)
ESO_ID    = os.environ.get("ESO_ID")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT_ID   = os.environ.get("TELEGRAM_CHAT_ID")

# URL, iš kurio skaitome ESO statusą
URL       = f"https://www.eso.lt/web/namams/gaminantis-vartotojas/laisvos-galios-patitikrinimas/{ESO_ID}?objectCode={ESO_ID}"
SNAPSHOT  = "last.html"


def fetch_html():
    # DEBUG: pranešimas apie užklausą
    print(f"DEBUG ▶️ Fetching URL: {URL}")
    r = requests.get(URL, timeout=30)
    print(f"DEBUG ▶️ HTTP status: {r.status_code}")
    r.raise_for_status()
    return r.text


def extract_text(html):
    # Išgauname tekstinę informaciją iš <div class="result-block">
    soup = BeautifulSoup(html, "html.parser")
    div = soup.find("div", class_="result-block")
    return div.get_text(strip=True) if div else html.strip()


def load_last():
    # Užkrauname paskutinį rezultatą iš failo, jei egzistuoja
    if os.path.exists(SNAPSHOT):
        try:
            return open(SNAPSHOT, encoding="utf-8").read()
        except Exception as e:
            print(f"DEBUG ▶️ Error reading snapshot: {e}")
    return None


def save_last(html):
    # Išsaugome naują HTML snapshotą
    with open(SNAPSHOT, "w", encoding="utf-8") as f:
        f.write(html)


def send_telegram(msg):
    # DEBUG: pranešimas apie Telegram siuntimą
    print(f"DEBUG ▶️ Sending telegram message: {msg}")
    resp = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
        data={"chat_id": CHAT_ID, "text": msg}
    )
    print(f"DEBUG ▶️ Telegram response: {resp.status_code}, {resp.text}")
    resp.raise_for_status()


def main():
    # DEBUG: patikriname, ar kintamieji nuskaitomi
    print(f"DEBUG ▶️ ESO_ID={ESO_ID}, BOT_TOKEN_set={bool(BOT_TOKEN)}, CHAT_ID_set={bool(CHAT_ID)}")

    html     = fetch_html()
    current  = extract_text(html)
    print(f"DEBUG ▶️ Current status: {current!r}")

    prev_html = load_last()
    previous  = extract_text(prev_html) if prev_html else None
    print(f"DEBUG ▶️ Previous status: {previous!r}")

    if current != previous:
        send_telegram(f"🔔 ESO atnaujino statusą:\n{current}")
        save_last(html)
    else:
        print("🔍 Naujienų nėra; statusas nepasikeitė.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3

import os
import requests
from bs4 import BeautifulSoup

# === Konfigūracija per aplinkos kintamuosius ===
ESO_ID            = os.environ["ESO_ID"]
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID   = os.environ["TELEGRAM_CHAT_ID"]
# Raktinis žodis, pagal kurį suprasim, kad rezultatas yra 'teigiamas'
POSITIVE_KEYWORD   = os.environ.get("POSITIVE_KEYWORD", "taip")  

# URL, kur tikriname statusą
URL = (
    f"https://www.eso.lt/web/namams/"
    f"gaminantis-vartotojas/laisvos-galios-patitikrinimas/"
    f"{ESO_ID}"
)

# Laikinas failas paskutiniam statusui
LAST_FILE = "last_status.txt"


def fetch_status_text() -> str:
    """Nuskaitome puslapį ir grąžiname švarų tekstą iš <div class="result-block">."""
    resp = requests.get(URL, timeout=30)
    resp.raise_for_status()
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")
    block = soup.find("div", class_="result-block")
    return block.get_text(strip=True) if block else ""


def load_previous() -> str:
    """Įkeliam paskutinį statusą iš disko (jei yra)."""
    if os.path.exists(LAST_FILE):
        return open(LAST_FILE, encoding="utf-8").read().strip()
    return ""


def save_current(status: str):
    """Išsaugom naują statusą, kad kitą kartą galėtume palyginti."""
    with open(LAST_FILE, "w", encoding="utf-8") as f:
        f.write(status)


def send_telegram(message: str):
    """Išsiunčiam pranešimą per Telegram Botą."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "parse_mode": "HTML",
        "text": message
    }
    resp = requests.post(url, data=payload, timeout=10)
    resp.raise_for_status()


def main():
    # 1) Nuskaitom dabartinį tekstą
    current = fetch_status_text()
    previous = load_previous()

    # 2) Ar statusas skiriasi ir ar jame yra teigiamas raktažodis?
    if current != previous and POSITIVE_KEYWORD.lower() in current.lower():
        # 3) Siunčiam pranešimą ir išsaugom naują statusą
        msg = (
            f"🔔 <b>ESO statusas pasikeitė į TEIGIAMĄ!</b>\n\n"
            f"Objekto kodas: <code>{ESO_ID}</code>\n"
            f"Rezultatas:\n<pre>{current}</pre>\n"
            f"<a href=\"{URL}\">Peržiūrėti ESO puslapyje</a>"
        )
        send_telegram(msg)
        save_current(current)
    else:
        # Jei nepasikeitė arba nėra teigiamo raktažodžio – išeinam
        print("♻️ Statusas nepasikeitė arba nėra teigiamas.")


if __name__ == "__main__":
    main()

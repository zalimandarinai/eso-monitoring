import os
import requests
from bs4 import BeautifulSoup

# Konfigūruok per GitHub Secrets
ESO_ID    = os.environ["ESO_ID"]
BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID   = os.environ["TELEGRAM_CHAT_ID"]

URL       = f"https://www.eso.lt/web/namams/gaminantis-vartotojas/laisvos-galios-patitikrinimas/{ESO_ID}?objectCode={ESO_ID}"
SNAPSHOT  = "last.html"

def fetch_html():
    r = requests.get(URL, timeout=30)
    r.raise_for_status()
    return r.text

def extract_text(html):
    soup = BeautifulSoup(html, "html.parser")
    div = soup.find("div", class_="result-block")
    return div.get_text(strip=True) if div else html.strip()

def load_last():
    if os.path.exists(SNAPSHOT):
        return open(SNAPSHOT, encoding="utf-8").read()
    return None

def save_last(html):
    with open(SNAPSHOT, "w", encoding="utf-8") as f:
        f.write(html)

def send_telegram(msg):
    resp = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
        data={"chat_id": CHAT_ID, "text": msg}
    )
    resp.raise_for_status()

def main():
    html     = fetch_html()
    current  = extract_text(html)
    previous = extract_text(load_last()) if load_last() else None

    if current != previous:
        send_telegram(f"🔔 ESO atnaujino statusą:\n{current}")
        save_last(html)
    else:
        print("🔍 Naujienų nėra; statusas nepasikeitė.")

if __name__ == "__main__":
    main()

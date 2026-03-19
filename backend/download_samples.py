import urllib.request
import os

images = {
    "sample_normal.jpg": "https://images.unsplash.com/photo-1549311693-519b7a42167d?q=80&w=800",
    "sample_heavy.jpg": "https://images.unsplash.com/photo-1580126207851-d9a2ffb4ca69?q=80&w=800",
    "sample_ambulance.jpg": "https://images.unsplash.com/photo-1587823521257-2e1d73c73708?q=80&w=800"
}

os.makedirs("assets", exist_ok=True)

for name, url in images.items():
    path = os.path.join("assets", name)
    try:
        urllib.request.urlretrieve(url, path)
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed to download {name}: {e}")

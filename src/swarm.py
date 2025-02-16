import requests
from rich import print
from time import sleep
from concurrent.futures import ThreadPoolExecutor
from cachetools import cached, LRUCache
from src.cache import cache


client_id = "ROUB2CQ40GYN2UMEOMBMOEQKEP2QYDE4BPT3YBMGBRXQMKDK"
client_secret = "E1PZFN45VKPMTKZHQFMO2FXSCBT4HM1CI51GWTKUVQOKDUI0"

headers = {"accept": "application/json"}

RIYADH = [
    (24.980807,46.537516),
    (24.894888,46.639137),
    (24.957157,46.792259),
    (24.779878,46.637650),
    (24.826640,46.815044),
    (24.712434,46.764911),
    (24.617157,46.622923),
    (24.576487,46.771912)
]

n = 0
@cached(cache=LRUCache(maxsize=1000))
def get_trending_venues(lat: float, lng: float, client_id: str, client_secret: str) -> dict:
    url = "https://api.foursquare.com/v2/venues/trending"
    
    params = {
        "v": "20250101",
        "ll": f"{lat},{lng}",
        "client_id": client_id,
        "client_secret": client_secret,
        "radius": 10000,  # 10km radius
        "limit": 30
    }
    
    headers = {"accept": "application/json"}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[red]Error fetching data for coordinates ({lat}, {lng}): {str(e)}[/red]")
        return None


@cached(cache=LRUCache(maxsize=1000))
def get_venue_details(venue_id: str) -> dict:
    print(f"Fetching venue[{venue_id[:5]}] details ")
    url = f"https://api.foursquare.com/v2/venues/{venue_id}/?oauth_token=3GRFICKJ53DUQ3KP5JKAK4EK0CJYOQEY3EKVVGIGYFVWGMCS"
    
    params = {
        "v": "20250101",
    }
    
    headers = {"accept": "application/json"}

    response = requests.get(url, params=params, headers=headers)
    return response.json()


def get_all_venues(points: list[tuple[float, float]]):
    all_venues = dict()
    for point in points:
        lat, lng = point
        print(f"Fetching trending venues near ({lat}, {lng})")
        
        result = get_trending_venues(lat, lng, client_id, client_secret)
        
        if result and 'response' in result:
            venues = result['response'].get('venues', [])
            for venue in venues:
                all_venues[venue['id']] = venue
    return all_venues


def con_get_venue_details(venue_id: str):
    venue = cache.venues.get(venue_id)
    if venue:
        return venue
    venue = get_venue_details(venue_id).get('response', {}).get("venue", {})
    
    idx = cache.get_venue_index(venue_id)
    venue['idx'] = idx
    cache.venues[venue_id] = venue
    return cache.venues[venue_id]


def worker():
    while True:
        all_venues = get_all_venues(RIYADH)
        total_venues = len(set(all_venues.keys()))
        print(f"[green]Total trending venues found: {total_venues}[/green]")
        
        with ThreadPoolExecutor(max_workers=3) as executor:
            for venue in all_venues.values():
                executor.submit(con_get_venue_details, venue['id'])

        print("[bold][green]Done[/green][/bold]")
        sleep(60*30) # 30 minutes


if __name__ == "__main__":
    worker()
     

import requests
from rich import print
from time import sleep

from concurrent.futures import ThreadPoolExecutor, as_completed
from cachetools import cached, LRUCache


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
        "limit": 50
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
    url = f"https://api.foursquare.com/v2/venues/{venue_id}/?oauth_token=3GRFICKJ53DUQ3KP5JKAK4EK0CJYOQEY3EKVVGIGYFVWGMCS"
    
    params = {
        "v": "20250101",
    }
    
    headers = {"accept": "application/json"}

    response = requests.get(url, params=params, headers=headers)
    return response.json()

    

def main():
    points = RIYADH
    
    all_venues = dict()
    for point in points:
        lat, lng = point
        print(f"[yellow]Fetching trending venues near ({lat}, {lng})[/yellow]")
        
        result = get_trending_venues(lat, lng, client_id, client_secret)
        
        if result and 'response' in result:
            venues = result['response'].get('venues', [])
            for venue in venues:
                all_venues[venue['id']] = venue
            

    total_venues = sum(len(venues) for venues in all_venues.values())
    print(f"[green]Total trending venues found: {total_venues}[/green]")
    
    categories = set()
    for venue in all_venues.values():
        categories.add(venue['categories'][0]['name'])
    
    print(categories)
    # for venue in all_venues.values():
        # print(get_venue_details(venue['id']))

    # for venue in all_venues.values():
    #     print(f"[green]Found {len(venues)} trending venues at this location[/green]")
    #     venues_details = {}
    #     with ThreadPoolExecutor(max_workers=1) as executor:
    #         futures = [executor.submit(get_venue_details, venue['id']) for venue in venues]
    #         for future in as_completed(futures):
    #             venue_details = future.result()
    #             try:
    #                 venues_details[venue_details['response']['venue']['id']] = venue_details['response'].get("venue", {})
    #             except:
    #                 print(venue_details)
    #     # Print venue details
    #     for venue in venues:
    #         venue_details = venues_details[venue['id']]
    #         print(f"[blue]- {venue.get('name')}: {venue.get('location', {}).get('address', 'No address')}, {venue_details.get('hereNow', {}).get('summary', 'No summary')}[/blue]")
    
    #     # Add delay to avoid hitting rate limits
    #     sleep(1)
    
    # Print summary
    print("\n[bold]Summary:[/bold]")
    total_venues = sum(len(venues) for venues in all_venues.values())
    print(f"[green]Total trending venues found: {total_venues}[/green]")

if __name__ == "__main__":
    main()
     


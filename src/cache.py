import os
import json
import threading
import time
import hashlib
from src.enums import Categories, PriceTier
from src.places_filter import filter_venues, classify_category

class Cache(dict):
    def __init__(self, filename: str):
        super().__init__()
        self.filename = filename

    def clear_all(self):
        self.clear()

    def _compute_hash(self, data: dict) -> str:
        return hashlib.md5(json.dumps(data, sort_keys=True).encode('utf-8')).hexdigest()

    def save_to_filesystem(self):
        temp_data = self.copy()
        current_hash = self._compute_hash(temp_data)
        if current_hash == self._compute_hash(self._read_from_filesystem() or {}):
            return

        os.makedirs(".cache", exist_ok=True)

        temp_file = f'.cache/{self.filename}.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(temp_data, f, ensure_ascii=False)
        os.replace(temp_file, f'.cache/{self.filename}')

    def _read_from_filesystem(self) -> dict|None:
        if os.path.exists(f'.cache/{self.filename}'):
            with open(f'.cache/{self.filename}', 'r', encoding='utf-8') as f:
                return json.load(f)
            
    def load_from_filesystem(self):
        data = self._read_from_filesystem()
        if not data:
            return
        self.update(data)


class GEOCache:
    def __init__(self):
        self.venues: Cache = Cache("venues_details.json")
        self.venues_ids: Cache = Cache("venues_ids.json")
        
        self.venues.load_from_filesystem()
        self.venues_ids.load_from_filesystem()
        self.start_sync()

    def get_venue_index(self, venue_id: str) -> int|None:
        """
        Get the index of a venue in the cache incremented by 1
        """
        if venue_id not in self.venues_ids.get('ids', []):
            self.venues_ids.setdefault('ids', []).append(venue_id)
        return self.venues_ids.get('ids', []).index(venue_id) + 1

    def start_sync(self, interval: int = 5):
        def sync():
            while True:
                self.venues.save_to_filesystem()
                self.venues_ids.save_to_filesystem()
                time.sleep(interval)

        thread = threading.Thread(target=sync, daemon=True)
        thread.start()

    def clean_venue_details(self, venue: dict) -> dict:
        venue.pop('id', None)
        venue.pop('canonicalUrl', None)
        venue.pop('popular', None)
        venue.pop('listed', None) # TODO: parse
        venue.pop('phrases', None) # TODO: parse
        venue.pop('tips', None) # TODO: parse
        venue.pop('storeId', None)
        venue.pop('photos', None)
        venue.pop('menu', None)
        venue.pop('header', None)
        venue.pop('ratingColor', None)
        venue.pop('ratingSignals', None)
        venue.pop('explanation', None)
        if venue.get('likes', None):
            venue['likes'].pop('groups', None)
        if venue.get('hereNow', None):
            venue['hereNow'].pop('groups', None)

        venue.pop('stats', None)
        venue['categories'] = [i['name'] for i in venue['categories']]
        venue['location'] = {
            "lat": venue['location']['lat'],
            "lng": venue['location']['lng'],
            "address": venue['location']['formattedAddress']
        }

        return venue

    def get_top_venues(self, n: int=5, location: tuple[float, float] = None, category: Categories = Categories.ALL, price_tier: PriceTier = PriceTier.ALL) -> list[dict]:
        venues = filter_venues([self.clean_venue_details(i) for i in self.venues.values()])
        venues = sorted(venues, key=lambda x: max(x.get('rating', 0), 6)/2 * x['hereNow']['count'], reverse=True)

        if category != Categories.ALL:
            venues = [i for i in venues if classify_category(i['categories']) == category]

        if price_tier != PriceTier.ALL:
            venues = [i for i in venues if price_tier.value in i['price']]

        return venues[:n]
    
    def get_venue_ratings(self, venue_id: str) -> list[dict]:
        venue: dict = self.venues.get(venue_id)
        if not venue:
            return []
        
        lists = []
        for group in venue.get('listed', {}).get('groups', []):
            for item in group.get('items', []):
                lists.append(f"{item.get('text', '')} - {item.get('description', '')}")

        comments = [i['text'] for i in venue.get('phrases', [])] 
        for group in venue.get('tips', {}).get('groups', []):
            for item in group.get('items', []):
                comments.append(item.get('text', ''))

        return comments

        

cache = GEOCache()
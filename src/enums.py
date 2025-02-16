from enum import Enum


class Categories(Enum):
    ALL = "all"
    CAFE = "cafe"
    RESTAURANT = "restaurant"
    LOUNGE = "lounge"
    EVENT = "event"
    HOTEL = "hotel"
    SHOPPING = "shopping"

class PriceTier(Enum):
    ALL = "all"
    CHEAP = "Cheap"
    MODERATE = "Moderate"
    EXPENSIVE = "Expensive"
    VERY_EXPENSIVE = "Very Expensive"


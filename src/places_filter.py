from src.enums import Categories

ALLOWED_CATEGORIES = { 
    "Juice Bar",
    "Lebanese Restaurant",
    "Event Space",
    "Gym and Studio",
    "Steakhouse",
    "Airport Lounge",
    "Coffee Roaster",
    "National Park",
    "Shopping Mall",
    "Restaurant",
    "Business Center",
    "Bakery",
    "Pizzeria",
    "Food Court",
    "Hookah Bar",
    "American Restaurant",
    "Tea Room",
    "French Restaurant",
    "Hiking Trail",
    "Burger Joint",
    "Festival",
    "Cafe, Coffee, and Tea House",
    "Coffee Shop",
    "Breakfast Spot",
    "Italian Restaurant",
    "City",
    "Swiss Restaurant",
    "Golf Course",
    "Plaza",
    "Shopping Plaza",
    "International Airport",
    "Village",
    "Café"
}

def is_allowed_category(category: str) -> bool:
    """
    Check if a given category is in the allowed categories list.
    
    Args:
        category (str): The venue category to check
        
    Returns:
        bool: True if the category is allowed, False otherwise
    """

    parital_filter_keywords = ["plaza", "mall", "cafe", "café", "coffee", "tea", "restaurant", "pub", "bar", "club", "lounge", "tea"]
    partial_filter = any(keyword in category.lower() for keyword in parital_filter_keywords)

    return category in ALLOWED_CATEGORIES or partial_filter

def filter_venues(venues: list) -> list:
    """
    Filter a list of venues to only include those with allowed categories.
    
    Args:
        venues (list): List of venue dictionaries, each containing a 'categories' field
        
    Returns:
        list: Filtered list of venues containing only allowed categories
    """
    filtered_venues = []
    
    for venue in venues:
        if 'categories' not in venue:
            continue
            
        for category in venue['categories']:
            if isinstance(category, dict):
                category = category.get("name")
                
            if is_allowed_category(category):
                filtered_venues.append(venue)
                break
                
    return filtered_venues




def classify_category(category: str) -> Categories:
    """
    Classifies a given category string into one of the predefined Categories enum values
    based on keywords present in the category name.
    
    Args:
        category (str): The category string to classify
        
    Returns:
        Categories: The corresponding Categories enum value
    """
    category = category.lower()
    
    # Cafe related keywords
    if any(keyword in category for keyword in [
        'cafe', 'café', 'coffee', 'tea', 'bakery'
    ]):
        return Categories.CAFE
    
    # Restaurant related keywords
    if any(keyword in category for keyword in [
        'restaurant', 'food', 'pizzeria', 'steakhouse',
        'burger', 'breakfast', 'juice bar', 'hookah',
        'dining'
    ]):
        return Categories.RESTAURANT
    
    # Lounge related keywords
    if any(keyword in category for keyword in [
        'lounge', 'bar'
    ]):
        return Categories.LOUNGE
    
    # Shopping related keywords
    if any(keyword in category for keyword in [
        'shop', 'mall', 'plaza', 'store', 'business center'
    ]):
        return Categories.SHOPPING
    
    # Hotel related keywords
    if any(keyword in category for keyword in [
        'hotel', 'resort', 'inn', 'accommodation'
    ]):
        return Categories.HOTEL
    
    # Event and attraction related keywords
    if any(keyword in category for keyword in [
        'event', 'festival', 'historic', 'park', 'trail',
        'cemetery', 'gym', 'studio', 'golf', 'airport',
        'terminal', 'hospital', 'neighborhood', 'city',
        'village'
    ]):
        return Categories.EVENT
    
    return Categories.ALL

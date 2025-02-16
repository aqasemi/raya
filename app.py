# refer to cache.py for:
# - get_venue_ratings
# - get_top_venues
# - clean_venue_details

# refer to swarm.py for everything related to venues, venues details, etc.

from flask import Flask, jsonify, request
from src.swarm import worker, cache
from threading import Thread
from flask_cors import CORS
from src.cache import Categories, PriceTier
from llm.main import chatbot, HumanMessage
from typing import Literal
from rich import print
import json

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

system_message = '''You are an assistant specifically designed to help tourists in Riyadh, Saudi Arabia. The user is based in riyadh in these coordinates: lat: 24.698889, lng: 46.685151
When a user asks for recommendations, use the tools 'get_top_venues' to find the top venues in the area and respond with: 'The top venues in Riyadh are: [list of venues].' 
If a user asks for information about a specific venue, use the tool 'get_venue_by_id' to retrieve details such as ratings and hours of operation, and present them concisely: 'The venue [venue name] has a rating of [rating] and is open [hours].' 
Most importantly, after you give any venue to the user, display the idx number of the venue inside curly brackets. E.g. "The top venues in Riyadh are: 1. Venue1 {idx: 1}"
Always provide friendly, concise, and accurate information tailored to the tourist's needs.
'''

def get_venue_ratings(venue_id: str) -> list[dict]:
    """ Get the ratings of a venue """
    return cache.get_venue_ratings(venue_id)

def get_top_venues(n: int=5, latitude: float = None, longitude: float = None, category: Literal["all", "cafe", "restaurant", "lounge", "event", "hotel", "shopping"] = "all", price_tier: Literal["all", "Cheap", "Moderate", "Expensive", "Very Expensive"] = "all") -> list[dict]:
    """ Get the top venues in the area based on the user's location, category, and price tier
    
    Args:
        n: number of venues to return, default is 5
        latitude: latitude coordinate, default is user's location
        longitude: longitude coordinate, default is user's location
        category: one of ["all", "cafe", "restaurant", "lounge", "event", "hotel", "shopping"], default is all
        price_tier: one of ["all", "Cheap", "Moderate", "Expensive", "Very Expensive"], default is all
    """
    location = (float(latitude), float(longitude)) if latitude is not None and longitude is not None else None
    category = Categories(category)
    price_tier = PriceTier(price_tier)
    return cache.get_top_venues(n, location, category, price_tier)

def get_venue_by_id(venue_id: str) -> dict:
    """ Get the details of a venue by its id """
    return cache.get_venue_by_id(venue_id)

graph = chatbot(
    system_message,
    [get_venue_ratings, get_top_venues, get_venue_by_id]
)
config = {"configurable": {"thread_id": "1"}}

@app.route("/")
def index():
    return "hi"

@app.route('/api/chat', methods=['POST'])
def chat():
    message = request.get_json().get('message')
    if not message:
        return jsonify({"error": "No message provided"}), 400

    try:
        response = graph.invoke({
            "messages": [HumanMessage(content=message)]
        }, config)
        
        assistant_message = response["messages"][-1].content
        
        return jsonify({
            "message": assistant_message
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trending-venues')
def trending_venues():
    # return all venues in cache
    return jsonify(list(cache.venues.values()))

@app.route('/api/historical-places')
def historical_places():
    with open('.cache/historical_places.json', 'r') as outf:
        data = json.loads(outf.read())
    
    return jsonify(data)

@app.route('/api/venue/<venue_idx>')
def venue(venue_idx: int):
    venue = get_venue_by_id(venue_idx)
    if venue:
        return jsonify(venue)
    return jsonify({"error": "Venue not found"}), 404


if __name__ == "__main__":
    Thread(target=worker, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)

    # test invoke the chatbot
    # graph = chatbot(system_message, [get_venue_ratings, get_top_venues, get_venue_by_id])
    # print(graph.invoke({"messages": [HumanMessage(content="give me best restraunt to visit")]}))
    # print(get_top_venues(
    #     5, 24.698889, 46.685151, category="restaurant"
    # ))

{
    "palce": "",
    "description": "",
    "location": "",
    "coordinates": [], # lat, long
    "todos": []
}
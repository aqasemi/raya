# refer to cache.py for:
# - get_venue_ratings
# - get_top_venues
# - clean_venue_details

# refer to swarm.py for everything related to venues, venues details, etc.

from flask import Flask, jsonify
from src.swarm import worker, cache
from threading import Thread
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route("/")
def index():
    # redirect to raya frontend
    return "hi"

@app.route('/api/trending-venues')
def trending_venues():
    # return all venues in cache
    return jsonify(list(cache.venues.values()))

@app.route('/api/venue/<venue_idx>')
def venue(venue_idx: int):
    # return venue details
    for v in cache.venues.values():
        if v['idx'] == venue_idx:
            return jsonify(v)
    return jsonify({"error": "Venue not found"}), 404


if __name__ == "__main__":
    Thread(target=worker, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)

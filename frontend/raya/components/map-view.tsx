"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { createRoot } from "react-dom/client"
import { VenuePopup } from "./venue-popup"

interface Venue {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  rating?: number
  price?: {
    currency: string
    message: string
    tier: number
  },
  hereNow: {
    count: number
  }
  photos?: {
    groups: Array<{
      items: Array<{
        prefix: string
        suffix: string
      }>
    }>
  }
  categories: Array<{
    icon: {
      prefix: string
      suffix: string
    }
  }>,
  categoryEnum: string
}

interface HistoricalPlace {
  place: string
  description: string
  location: string
  coordinates: [number, number]  // [latitude, longitude]
  todos: string[]
  img: string
}

interface MapViewProps {
  className?: string
  onPanelResize?: number
  venuesFilter?: string | null
  showHistoricalPlaces?: boolean
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

mapboxgl.setRTLTextPlugin(
  "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
  null,
  true,
)

export function MapView({ className, onPanelResize, venuesFilter, showHistoricalPlaces }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const resizeTimer = useRef<NodeJS.Timeout>()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historicalPlaces, setHistoricalPlaces] = useState<HistoricalPlace[]>([])
  const historicalMarkersRef = useRef<mapboxgl.Marker[]>([])

  const handleResize = () => {
    if (resizeTimer.current) {
      clearTimeout(resizeTimer.current)
    }
    
    resizeTimer.current = setTimeout(() => {
      if (map.current) {
        map.current.resize()
      }
    }, 100)
  }

  useEffect(() => {
    if (onPanelResize) {
      handleResize()
    }
  }, [onPanelResize])

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("http://172.20.10.2:5000/api/trending-venues")
        const data = await response.json()
        setVenues(data)
      } catch (err) {
        console.error("Error fetching venues:", err)
        setError("Failed to load venue data.")
      }
    }

    fetchVenues()
  }, [])

  useEffect(() => {
    const fetchHistoricalPlaces = async () => {
      try {
        const response = await fetch("http://172.20.10.2:5000/api/historical-places")
        const data = await response.json()
        setHistoricalPlaces(data)
      } catch (err) {
        console.error("Error fetching historical places:", err)
      }
    }

    fetchHistoricalPlaces()
  }, [])

  useEffect(() => {
    if (!mapContainer.current || !venues.length) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [46.7167, 24.6911], // Riyadh coordinates
      zoom: 11,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right")

    map.current.on("load", () => {
      setLoading(false)

      venues.forEach((venue) => {
        const popupNode = document.createElement("div")
        createRoot(popupNode).render(
          <VenuePopup
            name={venue.name}
            rating={venue.rating}
            price={venue.price}
            hereNowCount={venue.hereNow.count}
            photoUrl={
              venue.photos?.groups[0]?.items[0]
                ? `${venue.photos.groups[0].items[0].prefix}200x200${venue.photos.groups[0].items[0].suffix}`
                : undefined
            }
          />,
        )

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupNode)

        const el = document.createElement("div")
        el.className = "custom-marker"
        try {
          el.style.backgroundImage = `url(${venue.categories[0].icon.prefix}88${venue.categories[0].icon.suffix})`
        } catch {}
        el.style.width = "24px"
        el.style.height = "24px"
        el.style.backgroundSize = "100%"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "red"

        new mapboxgl.Marker(el).setLngLat([venue.location.lng, venue.location.lat]).setPopup(popup).addTo(map.current!)
      })
    })

    return () => map.current?.remove()
  }, [venues])

  useEffect(() => {
    if (!map.current || !historicalPlaces.length) return

    historicalMarkersRef.current.forEach(marker => marker.remove())
    historicalMarkersRef.current = []

    if (showHistoricalPlaces) {
      historicalPlaces.forEach((place) => {
        const popupNode = document.createElement("div")
        createRoot(popupNode).render(
          <VenuePopup
            name={place.place}
            description={place.description}
            photoUrl={place.img}
            isHistorical={true}
          />,
        )

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupNode)

        const el = document.createElement("div")
        el.className = "historical-marker"
        el.style.width = "24px"
        el.style.height = "24px"
        el.style.backgroundSize = "100%"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "#4a5568"

        const marker = new mapboxgl.Marker(el)
          .setLngLat([place.coordinates[1], place.coordinates[0]])
          .setPopup(popup)
          .addTo(map.current!)

        historicalMarkersRef.current.push(marker)
      })
    }
  }, [showHistoricalPlaces, historicalPlaces])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (map.current) {
        map.current.resize()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      <style jsx>{`
        .custom-marker {
          background-size: cover;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
        }
        .historical-marker {
          background-size: cover;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #2d3748;
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-destructive/50 flex items-center justify-center">
          <p className="text-destructive-foreground">{error}</p>
        </div>
      )}
    </div>
  )
}
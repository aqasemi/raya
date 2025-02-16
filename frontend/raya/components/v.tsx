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
  price?: string
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
  }>
}

interface MapViewProps {
  className?: string
  onPanelResize?: number
  venues: Venue[]
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

mapboxgl.setRTLTextPlugin(
  "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
  null,
  true,
)

export function MapView({ className, onPanelResize, venues }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mapContainer.current) return

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
    })

    return () => map.current?.remove()
  }, [])

  useEffect(() => {
    if (!map.current || !venues.length) return

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add new markers
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
      el.style.backgroundImage = `url(${venue.categories[0].icon.prefix}88${venue.categories[0].icon.suffix})`
      el.style.width = "44px"
      el.style.height = "44px"
      el.style.backgroundSize = "100%"

      const marker = new mapboxgl.Marker(el)
        .setLngLat([venue.location.lng, venue.location.lat])
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current.push(marker)
    })

    // Fit map to markers
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      markersRef.current.forEach((marker) => bounds.extend(marker.getLngLat()))
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [venues])

  useEffect(() => {
    if (map.current) {
      map.current.resize()
    }
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
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
    </div>
  )
}


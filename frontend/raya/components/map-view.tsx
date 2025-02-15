"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

interface MapViewProps {
  className?: string
}

// Initialize Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

// Load the RTL text plugin
// @ts-ignore
mapboxgl.setRTLTextPlugin(
  "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
  null,
  true, // Lazy load the plugin
)

export function MapView({ className }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [46.7167, 24.6911], // Riyadh coordinates [lng, lat]
      zoom: 11, // Default zoom level for city view
      localIdeographFontFamily: "'Noto Sans Arabic', 'Arial', sans-serif",
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right")

    // Handle map load
    map.current.on("load", () => {
      setLoading(false)

      // Example: Add a label in Arabic
      if (map.current) {
        map.current.addLayer({
          id: "arabic-label",
          type: "symbol",
          source: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [46.7167, 24.6911],
                  },
                  properties: {
                    title: "الرياض",
                  },
                },
              ],
            },
          },
          layout: {
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Arabic Regular"],
            "text-size": 16,
          },
          paint: {
            "text-color": "#000000",
          },
        })
      }
    })

    // Resize handler
    const resizeMap = () => {
      if (map.current) {
        map.current.resize()
      }
    }

    // Add resize event listener
    window.addEventListener("resize", resizeMap)

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeMap)
      map.current?.remove()
    }
  }, [])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
    </div>
  )
}


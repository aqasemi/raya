"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

interface MapViewProps {
  className?: string
  onPanelResize?: number
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

export function MapView({ className, onPanelResize }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const resizeTimer = useRef<NodeJS.Timeout>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle smooth resize
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

  // Listen for panel resize events
  useEffect(() => {
    if (onPanelResize) {
      handleResize()
    }
  }, [onPanelResize])

  useEffect(() => {
    if (!mapContainer.current) return

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [46.7167, 24.6911], // Riyadh coordinates [lng, lat]
        zoom: 11, // Default zoom level for city view
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right")

      // Handle map load
      map.current.on("load", () => {
        console.log("Map loaded successfully")
        setLoading(false)

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
              "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
              "text-size": 16,
              "text-offset": [0, -2],
              "text-anchor": "bottom",
            },
            paint: {
              "text-color": "#000000",
            },
          })

          // Add a point for Riyadh
          map.current.addLayer({
            id: "riyadh-point",
            type: "circle",
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
            paint: {
              "circle-radius": 8,
              "circle-color": "#FF69B4", // Using the primary color (pink)
            },
          })
        }
      })

      // Error handling
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e)
        setError("An error occurred while loading the map.")
      })
    } catch (err) {
      console.error("Error initializing map:", err)
      setError("Failed to initialize the map.")
    }

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
      if (map.current) {
        map.current.remove()
      }
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current)
      }
    }
  }, [])

  // Force re-render after a short delay
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
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
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


import { Star, Users } from "lucide-react"

interface VenuePopupProps {
  name: string
  rating?: number
  price?: {
    currency: string
    message: string
    tier: number
  }
  hereNowCount?: number
  photoUrl?: string
  description?: string
  isHistorical?: boolean
}

export function VenuePopup({ name, rating, price, hereNowCount, photoUrl }: VenuePopupProps) {
  return (
    <div className="p-4 max-w-[300px]">
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <div className="flex items-center gap-4 mb-2">
        {rating && (
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}
        {price && <span className="text-green-600 font-medium">{"$".repeat(price.tier)}</span>}
      </div>
      <div className="flex items-center mb-2">
        <Users className="w-4 h-4 mr-2" />
        <span>{hereNowCount} people here now</span>
      </div>
      {photoUrl && (
        <div className="mt-2">
          <img
            src={photoUrl || "/placeholder.svg"}
            alt={name}
            width={200}
            height={200}
            className="rounded-md object-cover"
          />
        </div>
      )}
    </div>
  )
}


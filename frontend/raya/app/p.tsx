"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, ChevronDown, Settings, ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { ReactMarkdownOptions } from "react-markdown/lib/react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapView } from "@/components/map-view"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

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
  categoryEnum: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const categories = [
  { name: "Restaurants", enum: "FOOD" },
  { name: "Cafes", enum: "COFFEE_SHOP" },
  { name: "Lounges", enum: "NIGHTLIFE_SPOT" },
  { name: "Events", enum: "EVENT_VENUE" },
  { name: "Hotels", enum: "HOTEL" },
  { name: "Shopping", enum: "SHOP" },
]

export default function Page() {
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to Raya! I can help you discover amazing places in Saudi Arabia. What would you like to know about?",
    },
  ])
  const [isOpen, setIsOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [resizeCount, setResizeCount] = useState(0)
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/trending-venues")
        const data = await response.json()
        setVenues(data)
        setFilteredVenues(data)
      } catch (err) {
        console.error("Error fetching venues:", err)
      }
    }

    fetchVenues()
  }, [])

  const handleCategoryClick = (categoryEnum: string) => {
    setSelectedCategory(categoryEnum)
    if (categoryEnum === selectedCategory) {
      setFilteredVenues(venues)
      setSelectedCategory(null)
    } else {
      const filtered = venues.filter((venue) => venue.categoryEnum === categoryEnum)
      setFilteredVenues(filtered)
    }
  }

  const handlePanelResize = () => {
    setResizeCount((prev) => prev + 1)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setChatMessages((prev) => [...prev, { role: "user", content: message }])
      // Here you would typically send the message to your AI backend and get a response
      // For now, we'll just echo the message back as the AI response
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `You said: ${message}` }])
      }, 500)
      setMessage("")
    }
  }

  return (
    <div className="h-[100vh] overflow-hidden">
      <PanelGroup direction="horizontal" className="h-full" onLayout={handlePanelResize}>
        <Panel
          defaultSize={20}
          minSize={10}
          maxSize={30}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
          collapsible
        >
          {isSidebarCollapsed ? (
            <div className="h-full flex items-center justify-center">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(false)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-card">
              <div className="p-4">
                <h1 className="text-2xl font-bold text-primary">raya</h1>
              </div>
              <Separator />
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <span>Trending Places</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pl-4">
                      {categories.map((category) => (
                        <Button
                          key={category.enum}
                          variant="ghost"
                          className={`w-full justify-start text-sm ${selectedCategory === category.enum ? "bg-primary text-primary-foreground" : ""}`}
                          onClick={() => handleCategoryClick(category.enum)}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                  <Button variant="ghost" className="w-full justify-start">
                    Historical Places
                  </Button>
                </div>
              </ScrollArea>
              <div className="p-4 mt-auto border-t">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          )}
        </Panel>
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
        <Panel>
          <PanelGroup direction="horizontal" className="h-full" onLayout={handlePanelResize}>
            <Panel className="h-full">
              <MapView venues={filteredVenues} onPanelResize={resizeCount} className="h-full" />
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
            <Panel defaultSize={30} minSize={20}>
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">AI Travel Assistant</h2>
                  <p className="text-sm text-muted-foreground">Ask me anything about places to visit in Saudi Arabia</p>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <ReactMarkdown
                          {...({} as ReactMarkdownOptions)}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <form className="flex gap-2" onSubmit={handleSendMessage}>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}


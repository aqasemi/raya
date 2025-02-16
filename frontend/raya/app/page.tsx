"use client"

import { useState, useEffect } from "react"
import { Send, ChevronDown, Settings, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapView } from "@/components/map-view"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

// Add this interface to type the chat request
interface ChatRequest {
  message: string;
  history: Message[];
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
  const [isOpen, setIsOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [resizeCount, setResizeCount] = useState(0)
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to load messages from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatMessages')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    // Default initial message if no history exists
    return [{
      role: 'assistant',
      content: 'Welcome to Raya! I can help you discover amazing places in Saudi Arabia. What would you like to know about?'
    }]
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages])

  // Add a function to clear chat history
  const clearChatHistory = () => {
    setMessages([{
      role: 'assistant',
      content: 'Welcome to Raya! I can help you discover amazing places in Saudi. What would you like to know about?'
    }])
    localStorage.removeItem('chatMessages')
  }

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("http://172.20.10.2:5000/api/trending-venues")
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage("")
    
    // Add user message to chat
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(updatedMessages)
    
    setIsLoading(true)
    try {
      const response = await fetch('http://172.20.10.2:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          // history: updatedMessages // Send the entire chat history including the new message
        } as ChatRequest),
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your message.' 
      }])
    } finally {
      setIsLoading(false)
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
                <h1 className="text-2xl font-bold text-primary">Raya</h1>
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
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive" 
                    onClick={clearChatHistory}
                  >
                    Clear Chat History
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Panel>
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
        <Panel>
          <PanelGroup direction="horizontal" className="h-full" onLayout={handlePanelResize}>
            <Panel className="h-full">
              <MapView 
                venuesFilter={selectedCategory} 
                onPanelResize={resizeCount} 
                className="h-full" 
                showHistoricalPlaces={true}
              />
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
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          msg.role === 'assistant' ? 'bg-muted' : 'bg-primary/10'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <form className="flex gap-2" onSubmit={sendMessage}>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
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


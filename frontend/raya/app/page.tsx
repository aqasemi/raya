"use client"

import { useState } from "react"
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

export default function Page() {
  const [message, setMessage] = useState("")
  const [isOpen, setIsOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [resizeCount, setResizeCount] = useState(0)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Raya! I can help you discover amazing places in Saudi Arabia. What would you like to know about?'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handlePanelResize = () => {
    setResizeCount((prev) => prev + 1)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage("")
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    setIsLoading(true)
    try {
      const response = await fetch('http://172.20.10.2:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
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
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        Restaurants
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        Cafes
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        Lounges
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        Events
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        Hotels
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm">
                        Shopping
                      </Button>
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
              <MapView onPanelResize={resizeCount} className="h-full" />
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


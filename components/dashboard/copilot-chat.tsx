"use client"

import { useChat } from "ai/react"
import { useRef, useEffect, useState } from "react"
import { Loader2, Download, Paperclip, Mic, ArrowUp, Zap, TrendingUp, Store, FileText, Users, Box, Hexagon, Plus, MessageSquare, User } from "lucide-react"
import { jsPDF } from "jspdf"

const SUGGESTIONS = [
  { text: "What GST rate applies to mobile phones?", icon: Zap },
  { text: "How to improve my profit margins in retail?", icon: TrendingUp },
  { text: "Best e-commerce platforms to sell in India", icon: Store },
  { text: "How to handle slow-moving inventory?", icon: Box },
  { text: "Explain GSTR-1 filing process", icon: FileText },
  { text: "Tips for negotiating with suppliers", icon: Users },
]

export default function CopilotChat({
  businessName,
  healthPercent,
  lowStock,
  growthDisplay,
}: {
  businessName: string
  healthPercent: string
  lowStock: number
  growthDisplay: string
}) {

  const [sessions, setSessions] = useState<{ id: string, title: string, updatedAt?: string, messages: any[] }[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>("default")

  /* ---------------- AI CHAT ---------------- */

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    error
  } = useChat({
    api: "/api/chat",
    body: {
      chatId: currentChatId
    }
  })

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  /* ---------------- LOAD CHAT HISTORY ---------------- */

  useEffect(() => {

    fetch(`/api/chat/history`)
      .then(res => res.json())
      .then(data => {

        if (data?.sessions?.length > 0) {

          setSessions(data.sessions)

          setCurrentChatId(data.sessions[0].id)

          setMessages(data.sessions[0].messages || [])

        } else {

          setCurrentChatId(Date.now().toString())

        }

      })
      .catch(console.error)
      .finally(() => setIsHistoryLoading(false))

  }, [setMessages])

  /* ---------------- NEW CHAT ---------------- */

  const startNewChat = () => {

    setCurrentChatId(Date.now().toString())

    setMessages([])

  }

  /* ---------------- SCROLL ---------------- */

  useEffect(() => {

    bottomRef.current?.scrollIntoView({ behavior: "smooth" })

  }, [messages])

  /* ---------------- EXPORT CHAT ---------------- */

  const exportSession = () => {

    if (!messages.length) return

    const doc = new jsPDF()
    let y = 20
    const margin = 10
    const pageHeight = doc.internal.pageSize.getHeight()
    const maxWidth = doc.internal.pageSize.getWidth() - 20

    doc.setFontSize(16)
    doc.text("RetailIQ Copilot - Chat Session", margin, y)
    y += 15

    doc.setFontSize(12)
    messages.forEach((m) => {
      const roleText = m.role === "user" ? "You:" : "RetailIQ:"
      
      doc.setFont("helvetica", "bold")
      doc.text(roleText, margin, y)
      y += 6

      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(m.content, maxWidth)
      
      lines.forEach((line: string) => {
        if (y > pageHeight - 20) {
          doc.addPage()
          y = 20
        }
        doc.text(line, margin, y)
        y += 6
      })
      y += 6
    })

    doc.save("RetailIQ-session.pdf")

  }

  /* ---------------- FILE UPLOAD ---------------- */

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (ev) => {

      const text = ev.target?.result

      if (typeof text === "string") {

        setInput(prev => prev + "\n" + text)

      }

    }

    reader.readAsText(file)

  }

  /* ---------------- VOICE INPUT ---------------- */

  const toggleRecording = () => {

    if (!("webkitSpeechRecognition" in window)) {

      alert("Voice not supported")

      return

    }

    const recognition = new (window as any).webkitSpeechRecognition()

    recognition.onstart = () => setIsRecording(true)

    recognition.onresult = (e: any) => {

      const transcript = e.results[0][0].transcript

      setInput(prev => prev + " " + transcript)

    }

    recognition.onend = () => setIsRecording(false)

    recognition.start()

  }

  /* ---------------- UI ---------------- */

  return (

    <div className="flex-1 flex flex-col h-full bg-black">

      {/* HEADER */}

      <div className="p-6 border-b border-[#1A2623] flex justify-between">

        <div className="flex items-center gap-3">

          <Zap className="text-green-400" />

          <div>

            <h1 className="text-white font-bold">

              RetailIQ Copilot

            </h1>

            <p className="text-xs text-gray-400">

              AI assistant for Indian retail

            </p>

          </div>

        </div>

        <button
          onClick={exportSession}
          className="text-green-400 flex items-center gap-2"
        >

          <Download size={16} /> Export

        </button>

      </div>

      {/* MESSAGES */}

      <div className="flex-1 overflow-y-auto p-8">

        {error && (

          <div className="bg-red-900 p-3 rounded">

            Failed to fetch

          </div>

        )}

        {!messages.length && !isHistoryLoading && (

          <div className="grid md:grid-cols-2 gap-4">

            {SUGGESTIONS.map((s, i) => (

              <button
                key={i}
                onClick={() => append({ role: "user", content: s.text })}
                className="border border-gray-800 p-4 rounded"
              >

                <s.icon className="text-green-400 mb-2" />

                {s.text}

              </button>

            ))}

          </div>

        )}

        {messages.map((m, i) => (

          <div
            key={i}
            className={`flex gap-4 mb-6 ${m.role === "user" ? "justify-end" : ""}`}
          >

            <div className="max-w-xl p-4 border border-gray-800 rounded">

              {m.content}

            </div>

          </div>

        ))}

        {isLoading && (

          <Loader2 className="animate-spin text-green-400" />

        )}

        <div ref={bottomRef} />

      </div>

      {/* INPUT */}

      <div className="p-6 border-t border-[#1A2623]">

        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-[#0D1513] border border-gray-800 rounded-xl px-3"
        >

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >

            <Paperclip />

          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={toggleRecording}
          >

            <Mic />

          </button>

          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything about your retail business..."
            className="flex-1 bg-transparent outline-none px-3 py-4 text-white"
          />

          <button
            type="submit"
            disabled={isLoading}
          >

            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ArrowUp />
            )}

          </button>

        </form>

      </div>

    </div>

  )

}
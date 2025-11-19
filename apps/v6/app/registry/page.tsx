"use client"

import { useState, useRef, useEffect } from "react"

interface LogEntry {
  type: "log" | "stdout" | "stderr" | "success" | "error"
  message: string
  timestamp: Date
}

export default function RegistryPage() {
  const [componentName, setComponentName] = useState("")
  const [componentContent, setComponentContent] = useState("")
  const [registryType, setRegistryType] = useState("registry:ui")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: new Date() }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setLogs([]) // Clear previous logs

    try {
      const response = await fetch("/api/registry/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: componentName,
          content: componentContent,
          registryType,
        }),
      })

      if (!response.body) {
        addLog("error", "No response body received")
        setIsSubmitting(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            addLog(data.type, data.message)

            // Reset form on success
            if (data.type === "success") {
              setTimeout(() => {
                setComponentName("")
                setComponentContent("")
              }, 1000)
            }
          } catch (e) {
            console.error("Failed to parse line:", line)
          }
        }
      }
    } catch (error: any) {
      addLog("error", `An error occurred: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "stderr":
        return "text-yellow-400"
      case "stdout":
        return "text-blue-400"
      default:
        return "text-gray-300"
    }
  }

  const getLogPrefix = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "✓"
      case "error":
        return "✗"
      case "stderr":
        return "⚠"
      case "stdout":
        return "→"
      default:
        return "•"
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Registry Component
          </h1>
          <p className="text-muted-foreground text-lg">
            Add a new component to the MadUI registry with real-time build output
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="componentName"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <span className="text-blue-500">📦</span>
                    Component Name
                  </label>
                  <input
                    id="componentName"
                    type="text"
                    placeholder="e.g., my-button"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    required
                    className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50"
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="registryType"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <span className="text-purple-500">🏷️</span>
                    Registry Type
                  </label>
                  <select
                    id="registryType"
                    value={registryType}
                    onChange={(e) => setRegistryType(e.target.value)}
                    className="flex h-11 w-full rounded-lg border-2 border-input bg-black text-white px-4 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 cursor-pointer"
                  >
                    <option value="registry:ui" className="bg-black text-white py-2">UI</option>
                    <option value="registry:block" className="bg-black text-white py-2">Block</option>
                    <option value="registry:example" className="bg-black text-white py-2">Example</option>
                    <option value="registry:hook" className="bg-black text-white py-2">Hook</option>
                    <option value="registry:lib" className="bg-black text-white py-2">Lib</option>
                    <option value="registry:chart" className="bg-black text-white py-2">Chart</option>
                    <option value="registry:internal" className="bg-black text-white py-2">Internal</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="componentContent"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <span className="text-green-500">💻</span>
                    Component Content (.tsx)
                  </label>
                  <textarea
                    id="componentContent"
                    placeholder="Paste your TSX component code here..."
                    value={componentContent}
                    onChange={(e) => setComponentContent(e.target.value)}
                    required
                    rows={16}
                    className="flex w-full rounded-lg border-2 border-input bg-black/50 px-4 py-3 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 font-mono hover:border-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] h-11 px-6 py-2 w-full"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding Component...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Component
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Terminal Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold leading-none flex items-center gap-2">
              <span className="text-cyan-500">⚡</span>
              Build Output
            </label>
            <div className="rounded-xl border-2 border-border bg-card shadow-lg overflow-hidden">
              <div className="bg-linear-to-r from-gray-900 to-black px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-gray-400 font-mono ml-2">
                  terminal
                </span>
              </div>
              <div
                ref={terminalRef}
                className="bg-black p-4 font-mono text-sm h-[580px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
              >
                {logs.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500 animate-pulse">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-500"></span>
                    Waiting for build output...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`${getLogColor(log.type)} whitespace-pre-wrap wrap-break-word leading-relaxed`}
                      >
                        <span className="text-gray-600 mr-2 text-xs">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="mr-2 font-bold">{getLogPrefix(log.type)}</span>
                        {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

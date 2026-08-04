"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface PdfQaChatProps {
  paperId: string;
  pdfUrl: string;
  paperTitle: string;
}

interface QaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: "high" | "medium" | "low" | "cached";
}

const SUGGESTED_QUESTIONS = [
  "What is the main contribution of this paper?",
  "What dataset was used for evaluation?",
  "What are the limitations mentioned?",
  "How does this compare to prior work?",
];

export function PdfQaChat({ paperId, pdfUrl, paperTitle }: PdfQaChatProps) {
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load cached Q&A history on mount
  useEffect(() => {
    // We don't have a dedicated history endpoint, but cached answers are returned
    // by /api/ai/ask-paper when the same question is asked again. For simplicity,
    // we don't preload anything here.
  }, [paperId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const askQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: QaMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question.trim(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl, question: question.trim(), paperId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const aiMsg: QaMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        confidence: data.confidence,
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (e) {
      const aiMsg: QaMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I couldn't process that question. ${e instanceof Error ? e.message : "Please try again."}`,
        confidence: "low",
      };
      setMessages((m) => [...m, aiMsg]);
      toast.error("Q&A failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Ask This Paper</h2>
          <p className="text-xs text-muted-foreground">
            Q&A over the full PDF — answers cite specific sections of the paper.
          </p>
        </div>
      </div>

      {/* Chat history */}
      <div
        ref={scrollRef}
        className="space-y-3 max-h-72 overflow-y-auto mb-3 pr-1"
      >
        {messages.length === 0 && (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Ask any question about this paper. We&apos;ll fetch the PDF and answer based on its full text.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => askQuestion(q)}
                  className="rounded-full border border-violet-500/30 bg-violet-500/5 px-2.5 py-1 text-xs text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-background border border-border"
              }`}
            >
              {m.role === "assistant" && m.confidence && (
                <div className="mb-1">
                  <ConfidenceBadge confidence={m.confidence} />
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border border-border rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading the PDF…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void askQuestion(input);
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask a question about "${paperTitle.slice(0, 40)}${paperTitle.length > 40 ? "…" : ""}"…`}
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </Card>
  );
}

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" | "cached" }) {
  const map: Record<string, { label: string; className: string }> = {
    high: { label: "High confidence", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
    medium: { label: "Medium confidence", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30" },
    low: { label: "Low confidence", className: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30" },
    cached: { label: "Cached answer", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  };
  const cfg = map[confidence];
  return (
    <Badge variant="outline" className={`text-xs ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

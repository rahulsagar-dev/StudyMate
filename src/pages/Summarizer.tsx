import { useState } from "react";
import { FileText, Upload, Sparkles, Copy, Download, Check } from "lucide-react";

export default function Summarizer() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setSummary(
        "This is a demonstration of the AI-powered summarization feature. In a fully integrated version, this would display a concise summary of your input text, highlighting key points and main ideas. The summary would be optimized for quick review and study purposes."
      );
      setIsProcessing(false);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-xp flex items-center justify-center">
          <FileText className="h-6 w-6 text-xp-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">AI Summarizer</h1>
          <p className="text-muted-foreground">Condense your notes with AI-powered summarization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Input Text</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Upload className="h-4 w-4" />
                Upload File
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes, articles, or any text you want to summarize..."
              className="w-full h-64 bg-secondary rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {text.length} characters
              </span>
              <button
                onClick={handleSummarize}
                disabled={!text.trim() || isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Summarize
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Summary Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Summary Length</span>
                <select className="bg-secondary rounded-lg px-3 py-1.5 text-sm text-foreground outline-none">
                  <option>Short</option>
                  <option>Medium</option>
                  <option>Detailed</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Include Key Points</span>
                <div className="w-10 h-6 bg-primary rounded-full p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Generate Flashcards</span>
                <div className="w-10 h-6 bg-muted rounded-full p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-muted-foreground rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Summary</h3>
            {summary && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-xp" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            )}
          </div>

          {summary ? (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-xl border border-border/50">
                <p className="text-foreground leading-relaxed">{summary}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <h4 className="text-sm font-medium text-primary mb-2">Key Points</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    AI-powered summarization for efficient studying
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    Highlights main ideas and key concepts
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    Optimized for quick review and retention
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Your AI-generated summary will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { FileText, Copy, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateSummary, type SummaryResult } from "@/services/summarizerService";

export default function Summarizer() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({ title: "Empty input", description: "Paste some text first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await generateSummary(inputText);
      setResult(data);
    } catch {
      toast({ title: "Error", description: "Failed to generate summary.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.summary);
      toast({ title: "Copied!", description: "Summary copied to clipboard." });
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Summarizer</h1>
          <p className="text-sm text-muted-foreground">Condense your notes into clear summaries</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <Textarea
            placeholder="Paste your notes here to generate a summary..."
            className="min-h-[200px] bg-secondary/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground focus:border-primary/50"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={loading || !inputText.trim()} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate Summary"}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={loading} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card className="glass-card">
          <CardContent className="p-6 space-y-3">
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="h-4 w-full rounded shimmer" />
            <div className="h-4 w-2/3 rounded shimmer" />
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <Card className="glass-card animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Summary</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">{result.summary}</p>

            {result.keyPoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Points</h4>
                <ul className="space-y-1.5">
                  {result.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Original: {result.wordCount} words
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

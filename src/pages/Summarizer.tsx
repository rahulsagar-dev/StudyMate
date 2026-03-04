import { useState, useRef } from "react";
import {
  FileText,
  Copy,
  Trash2,
  Loader2,
  Sparkles,
  Upload,
  History,
  Eye,
  File,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useSummaries, type Summary } from "@/hooks/useSummaries";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MODE_LABELS: Record<string, string> = {
  assignment: "Assignment Summary",
  detailed: "Detailed Summary",
  bullet: "Bullet Point Summary",
};

export default function Summarizer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { summaries, generating, generateSummary, deleteSummary, loading: historyLoading } = useSummaries();

  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<string>("assignment");
  const [result, setResult] = useState<{
    summary: string;
    word_count: number;
    compression_ratio: number;
  } | null>(null);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  const canGenerate = charCount >= 100 && !generating;

  // ---- Generate ----
  const handleGenerate = async () => {
    if (!canGenerate) return;
    const data = await generateSummary(inputText, mode);
    if (data) {
      setResult(data);
    }
  };

  // ---- Copy ----
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.summary);
      toast({ title: "Copied!", description: "Summary copied to clipboard." });
    }
  };

  // ---- Clear ----
  const handleClear = () => {
    setInputText("");
    setResult(null);
    setUploadedFile(null);
  };

  // ---- File upload ----
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setUploading(true);

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: filePath,
          file_type: file.type,
          file_size: file.size,
          processing_status: "pending",
        })
        .select()
        .single();

      if (docError) throw docError;

      // Call parse-document
      const { data: parseData, error: parseError } = await supabase.functions.invoke(
        "parse-document",
        { body: { document_id: doc.id, file_url: filePath } }
      );

      if (parseError) throw parseError;
      if (parseData?.error) throw new Error(parseData.error);

      if (parseData?.extracted_text) {
        setInputText(parseData.extracted_text);
        toast({ title: "Document parsed", description: `Extracted ${parseData.word_count} words.` });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: err.message || "Could not process file.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ---- Load from history ----
  const handleLoadSummary = (s: Summary) => {
    setInputText(s.original_text);
    setResult({
      summary: s.summary_text,
      word_count: s.word_count,
      compression_ratio: s.compression_ratio,
    });
    setMode(s.summary_type);
  };

  // ---- Stats ----
  const originalChars = inputText.length;
  const originalWords = wordCount;
  const summaryChars = result?.summary.length ?? 0;
  const summaryWords = result?.word_count ?? 0;
  const compressionPct = result ? Math.round(result.compression_ratio * 100) : 0;
  const reductionPct = result ? 100 - compressionPct : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary">
            Summarizer
          </h1>
          <p className="text-muted-foreground mt-1">
            Transform lengthy texts into concise, meaningful summaries
          </p>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Summary History</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-2">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-lg shimmer" />
                  ))}
                </div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No summaries yet.</p>
                  <p className="text-sm">Generate your first summary!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summaries.map((s) => (
                    <Card key={s.id} className="glass-card">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {MODE_LABELS[s.summary_type] ?? s.summary_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {s.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {s.original_text}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(s.compression_ratio * 100)}% of original
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleLoadSummary(s)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(s.summary_text);
                                toast({ title: "Copied!" });
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteSummary(s.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Input Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your text here…"
                className="min-h-[300px] bg-secondary/50 border-border/50 resize-none text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{charCount} characters</span>
                <span>{wordCount} words</span>
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground font-medium">OR</span>
                <Separator className="flex-1" />
              </div>

              {/* File upload */}
              <div
                className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Processing document…</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <File className="h-8 w-8 text-primary" />
                    <p className="text-sm text-foreground font-medium">{uploadedFile.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Upload Document</p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOCX, and TXT files
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              {/* Mode selector */}
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Summary mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment Summary (~15%)</SelectItem>
                  <SelectItem value="detailed">Detailed Summary (~30%)</SelectItem>
                  <SelectItem value="bullet">Bullet Point Summary (~20–25%)</SelectItem>
                </SelectContent>
              </Select>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex-1 gap-2"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generating ? "Generating…" : "Generate Summary"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClear}
                  disabled={generating}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {charCount > 0 && charCount < 100 && (
                <p className="text-xs text-muted-foreground">
                  {100 - charCount} more characters needed to generate a summary.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT: Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Summary Result
              </CardTitle>
              {result && !generating && (
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center min-h-[300px]"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      <div className="relative p-4 rounded-full bg-primary/10">
                        <FileText className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Generating your summary…
                    </p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg bg-muted/50 p-4 min-h-[300px]">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                        {result.summary}
                      </p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="stat-card">
                        <p className="text-xs text-muted-foreground mb-1">Original Length</p>
                        <p className="text-sm font-semibold text-foreground">
                          {originalChars.toLocaleString()} chars
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {originalWords.toLocaleString()} words
                        </p>
                      </div>
                      <div className="stat-card">
                        <p className="text-xs text-muted-foreground mb-1">Summary Length</p>
                        <p className="text-sm font-semibold text-foreground">
                          {summaryChars.toLocaleString()} chars
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summaryWords.toLocaleString()} words
                        </p>
                      </div>
                      <div className="stat-card">
                        <p className="text-xs text-muted-foreground mb-1">Compression Ratio</p>
                        <Badge variant="secondary">{compressionPct}% of original</Badge>
                      </div>
                      <div className="stat-card">
                        <p className="text-xs text-muted-foreground mb-1">Reduction</p>
                        <Badge className="bg-primary/20 text-primary border-0">
                          {reductionPct}% compressed
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground"
                  >
                    <FileText className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Your summary will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

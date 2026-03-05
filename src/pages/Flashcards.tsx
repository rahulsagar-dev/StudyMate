import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronLeft, ChevronRight, RotateCcw, Save, Trash2, Play,
  Upload, FileText, Download, History, LogIn, Loader2, X, Copy, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useNavigate } from "react-router-dom";

interface FlashcardData {
  front: string;
  back: string;
}

const MOCK_CARDS: FlashcardData[] = [
  { front: "What is the capital of France?", back: "Paris is the capital of France." },
  { front: "Explain photosynthesis.", back: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen." },
  { front: "What is machine learning?", back: "Machine learning is a subset of artificial intelligence where systems learn patterns from data to make predictions or decisions." },
];

const ALLOWED_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".docx", ".pptx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Flashcards() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const {
    flashcardSets, generationHistory, loading: hookLoading,
    createFlashcardSet, deleteFlashcardSet, loadFlashcardsForSet,
    saveGenerationHistory, deleteGenerationHistory,
  } = useFlashcards();

  // Input state
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cardCountOption, setCardCountOption] = useState("15-20");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Flashcard display state
  const [cards, setCards] = useState<FlashcardData[]>(MOCK_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Save state
  const [setName, setSetName] = useState("");

  // History sheet
  const [historyOpen, setHistoryOpen] = useState(false);

  const getCardCount = (): number => {
    switch (cardCountOption) {
      case "5-10": return 8;
      case "10-15": return 12;
      case "15-20": return 17;
      case "20-25": return 22;
      case "auto": return 0;
      default: return 15;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast({ title: "Invalid file type", description: `Supported: ${ALLOWED_EXTENSIONS.join(", ")}`, variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    let textToUse = inputText.trim();

    if (!textToUse && !selectedFile) {
      toast({ title: "No input", description: "Paste text or upload a file.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // If file is selected, upload and parse
      if (selectedFile && !textToUse) {
        setProgress(10);
        const filePath = `${user?.id || "anon"}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, selectedFile);

        if (uploadError) throw new Error("File upload failed: " + uploadError.message);
        setProgress(30);

        const { data: parseData, error: parseError } = await supabase.functions.invoke("parse-document", {
          body: { file_path: filePath, file_name: selectedFile.name },
        });

        if (parseError) throw new Error("File parsing failed");
        textToUse = parseData?.text || parseData?.extracted_text || "";
        setProgress(50);
      } else {
        setProgress(20);
      }

      if (textToUse.length < 50) {
        toast({ title: "Not enough text", description: "Please provide at least 50 characters.", variant: "destructive" });
        setGenerating(false);
        return;
      }

      setProgress(60);

      const count = getCardCount() || Math.min(Math.max(Math.floor(textToUse.length / 200), 5), 25);

      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { input_text: textToUse, card_count: count },
      });

      setProgress(90);

      if (error) throw new Error(error.message || "Generation failed");
      if (data?.error) throw new Error(data.error);

      const generatedCards: FlashcardData[] = (data.flashcards || []).map((c: any) => ({
        front: c.front,
        back: c.back,
      }));

      if (generatedCards.length === 0) throw new Error("No flashcards generated");

      setCards(generatedCards);
      setCurrentIndex(0);
      setFlipped(false);
      setProgress(100);

      // Save to history if authenticated
      if (user) {
        await saveGenerationHistory({
          input_text: textToUse.substring(0, 1000),
          source_type: selectedFile ? "file" : "text",
          source_filename: selectedFile?.name,
          output_data: generatedCards,
          card_count: generatedCards.length,
        });
      }

      toast({ title: "Flashcards generated!", description: `${generatedCards.length} cards created.` });
    } catch (err) {
      console.error("Generation error:", err);
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  };
  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
  };
  const handleFlip = () => setFlipped((f) => !f);

  const handleSaveSet = async () => {
    if (!setName.trim()) {
      toast({ title: "Enter a name", variant: "destructive" });
      return;
    }
    await createFlashcardSet(setName.trim(), cards);
    setSetName("");
  };

  const handleLoadSet = async (setId: string) => {
    const loadedCards = await loadFlashcardsForSet(setId);
    if (loadedCards.length > 0) {
      setCards(loadedCards.map((c) => ({ front: c.front_text, back: c.back_text })));
      setCurrentIndex(0);
      setFlipped(false);
      toast({ title: "Set loaded!" });
    }
  };

  const handleLoadHistory = (entry: any) => {
    const data = entry.output_data as FlashcardData[];
    if (data && data.length > 0) {
      setCards(data);
      setCurrentIndex(0);
      setFlipped(false);
      setHistoryOpen(false);
      toast({ title: "History loaded!" });
    }
  };

  const handleExportCSV = () => {
    if (cards.length === 0) return;
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = "Front,Back\n" + cards.map((c) => `${escape(c.front)},${escape(c.back)}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV downloaded!" });
  };

  const handleCopyAll = () => {
    const text = cards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const currentCard = cards[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6 pb-8"
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gradient-primary">Flashcards</h1>
            <p className="text-sm text-muted-foreground">Generate AI-powered flashcards from text or files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyAll} disabled={cards.length === 0}>
            <Copy className="h-4 w-4" /> Copy All
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} disabled={cards.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" /> History{generationHistory.length > 0 ? ` (${generationHistory.length})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Generation History</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
                {generationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No history yet.</p>
                ) : (
                  generationHistory.map((entry) => (
                    <Card key={entry.id} className="bg-secondary/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{entry.card_count} cards</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{entry.source_type === "file" ? entry.source_filename : "Text Input"}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleLoadHistory(entry)}>
                            <Play className="h-3.5 w-3.5" /> Load
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => deleteGenerationHistory(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 2. Input Card */}
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Study Material</label>
            <Textarea
              placeholder="Paste your study material here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] bg-secondary/50 border-border/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <Separator className="flex-1" />
          </div>

          {/* File Upload */}
          {selectedFile ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground flex-1 truncate">{selectedFile.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">.txt .pdf .docx .pptx — Max 10MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.pdf,.docx,.pptx"
            onChange={handleFileSelect}
          />

          {/* Card Count + Generate */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-48">
              <label className="text-sm font-medium text-foreground mb-2 block">Card Count</label>
              <Select value={cardCountOption} onValueChange={setCardCountOption}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-10">5-10 cards</SelectItem>
                  <SelectItem value="10-15">10-15 cards</SelectItem>
                  <SelectItem value="15-20">15-20 cards (recommended)</SelectItem>
                  <SelectItem value="20-25">20-25 cards</SelectItem>
                  <SelectItem value="auto">Auto (based on content)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="gap-2 bg-gradient-primary hover:opacity-90"
              onClick={handleGenerate}
              disabled={generating || (!inputText.trim() && !selectedFile)}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {generating ? "Generating..." : "Generate Flashcards"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Progress Bar */}
      <AnimatePresence>
        {(generating || progress > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Card {currentIndex + 1} of {cards.length}</Badge>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--gradient-primary)" }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Flashcard Display */}
      {currentCard && (
        <div className="max-w-2xl mx-auto">
          <div
            className="flip-card cursor-pointer h-[320px]"
            onClick={handleFlip}
          >
            <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>
              {/* Front */}
              <div className="flip-card-front flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground leading-relaxed">{currentCard.front}</p>
                <p className="text-xs text-muted-foreground mt-4">Click to reveal answer</p>
              </div>
              {/* Back */}
              <div className="flip-card-back flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-lg text-foreground leading-relaxed">{currentCard.back}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Navigation Controls */}
      {cards.length > 0 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="lg" onClick={handlePrev} className="gap-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={handleFlip} className="gap-2">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={handleNext} className="gap-2">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* 6. Save Section */}
      <Card className="glass-card">
        <CardContent className="p-6">
          {!user ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <LogIn className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sign in to save your flashcard sets</p>
              <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Input
                placeholder="Set name..."
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
              <Button
                className="gap-2 shrink-0"
                onClick={handleSaveSet}
                disabled={hookLoading || cards.length === 0}
              >
                <Save className="h-4 w-4" /> Save Set
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Saved Sets Section */}
      {user && flashcardSets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold text-foreground">Saved Sets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flashcardSets.map((set) => (
              <Card key={set.id} className="bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{set.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {set.card_count || 0} cards · {new Date(set.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleLoadSet(set.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFlashcardSet(set.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

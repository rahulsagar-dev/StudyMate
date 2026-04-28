import { useState, useCallback, useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, FolderOpen, Sparkles, Download, Trash2, Loader2 } from "lucide-react";
import { useWhiteboards } from "@/hooks/useWhiteboards";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WhiteboardListener } from "@/components/VoiceAgent/WhiteboardListener";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Whiteboard() {
  const { user } = useAuth();
  const { whiteboards, isLoading, loadWhiteboard, save, isSaving, deleteWhiteboard } = useWhiteboards();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled Whiteboard");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [isGenerating, setIsGenerating] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChanges = useRef(false);

  // Receive elements pushed by the AI voice agent (Aria) — supports both
  // raw arrays and { elements: [...] } payload shapes.
  const handleAgentDraw = useCallback(
    (raw: unknown) => {
      if (!excalidrawAPI) {
        console.warn("[Whiteboard] Agent draw arrived but Excalidraw not ready yet");
        return;
      }
      const rawElements = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { elements?: unknown[] })?.elements)
          ? (raw as { elements: unknown[] }).elements
          : [];
      if (!rawElements.length) {
        console.log("[Whiteboard] Agent draw with empty elements — ignoring");
        return;
      }
      // Sanitize incoming elements to prevent Excalidraw infinite-recursion
      // crashes caused by orphan containerId refs, duplicate ids, or zero-size
      // text containers (triggers updateWysiwygStyle -> mutateElement loop).
      const seenIds = new Set<string>();
      const validIds = new Set<string>();
      for (const el of rawElements as any[]) {
        if (el && typeof el === "object" && el.id) validIds.add(el.id);
      }
      const incomingElements = (rawElements as any[])
        .filter((el) => el && typeof el === "object" && el.type)
        .map((el) => {
          // Ensure unique id
          let id = String(el.id ?? `gen_${Math.random().toString(36).slice(2)}`);
          while (seenIds.has(id)) id = `${id}_${Math.random().toString(36).slice(2, 6)}`;
          seenIds.add(id);
          // Enforce min dimensions to avoid 0-width text wysiwyg loops
          const width = Math.max(20, Number(el.width) || 100);
          const height = Math.max(20, Number(el.height) || 40);
          // Drop orphan container references
          const containerId =
            el.containerId && validIds.has(el.containerId) ? el.containerId : null;
          const boundElements = Array.isArray(el.boundElements)
            ? el.boundElements.filter((b: any) => b?.id && validIds.has(b.id))
            : [];
          return { ...el, id, width, height, containerId, boundElements };
        }) as never[];
      try {
        const existing = excalidrawAPI.getSceneElements();
        excalidrawAPI.updateScene({
          elements: [...existing, ...incomingElements],
        });
        excalidrawAPI.scrollToContent(incomingElements, {
          fitToViewport: true,
          viewportZoomFactor: 0.9,
          animate: true,
        });
        hasChanges.current = true;
        console.log(`[Whiteboard] Applied ${incomingElements.length}/${rawElements.length} elements from Aria`);
      } catch (e) {
        console.error("Failed to apply agent whiteboard update:", e);
      }
    },
    [excalidrawAPI],
  );

  // Listen for direct LiveKit data-channel pushes from Aria (low-latency path)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      handleAgentDraw(detail?.elements);
    };
    window.addEventListener("aria:whiteboard-draw", handler);
    return () => window.removeEventListener("aria:whiteboard-draw", handler);
  }, [handleAgentDraw]);

  // Ensure there is a saved whiteboard row before Aria starts a session so
  // her writes always have a target id. Creates a row only if user is on a
  // brand-new untitled board.
  useEffect(() => {
    if (!user || !excalidrawAPI) return;
    let cancelled = false;
    const ensure = async () => {
      if (currentId) return;
      try {
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const result = await save({
          title,
          elements: elements as any[],
          app_state: {
            viewBackgroundColor: appState.viewBackgroundColor,
          },
        });
        if (!cancelled && result.data) {
          setCurrentId(result.data.id);
          console.log("[Whiteboard] Pre-created board for Aria:", result.data.id);
        }
      } catch (err) {
        console.warn("[Whiteboard] Could not pre-create board:", err);
      }
    };
    // small delay so initial render settles
    const t = setTimeout(ensure, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, excalidrawAPI]);

  // Auto-save debounced
  const scheduleAutoSave = useCallback(() => {
    if (!user || !excalidrawAPI) return;
    hasChanges.current = true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!hasChanges.current || !excalidrawAPI) return;
      try {
        const elements = excalidrawAPI.getSceneElements();
        // Guard: never overwrite a saved board with an empty canvas
        // (prevents clobbering Aria's drawings during her teaching session)
        if (elements.length === 0 && currentId) {
          console.log("[Whiteboard] Skipping auto-save: empty canvas on existing board");
          hasChanges.current = false;
          return;
        }
        const appState = excalidrawAPI.getAppState();
        const result = await save({
          id: currentId ?? undefined,
          title,
          elements: elements as any[],
          app_state: {
            viewBackgroundColor: appState.viewBackgroundColor,
            zoom: appState.zoom,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
          },
        });
        if (!currentId && result.data) setCurrentId(result.data.id);
        hasChanges.current = false;
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 30000);
  }, [user, excalidrawAPI, currentId, title, save]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save whiteboards");
      return;
    }
    if (!excalidrawAPI) return;

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const result = await save({
        id: currentId ?? undefined,
        title,
        elements: elements as any[],
        app_state: {
          viewBackgroundColor: appState.viewBackgroundColor,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
      });

      if (result.isNew && result.data) {
        setCurrentId(result.data.id);
        // Award XP for new whiteboard save
        try {
          await supabase.rpc("award_xp", {
            p_user_id: user.id,
            p_amount: 15,
            p_source: "whiteboard_save",
            p_source_id: result.data.id,
          });
          toast.success("Whiteboard saved! +15 XP");
        } catch {
          toast.success("Whiteboard saved!");
        }
      } else {
        toast.success("Whiteboard saved!");
      }
      hasChanges.current = false;
    } catch (err) {
      toast.error("Failed to save whiteboard");
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const wb = await loadWhiteboard(id);
      setCurrentId(wb.id);
      setTitle(wb.title);
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements: wb.elements,
        });
        if (wb.app_state?.viewBackgroundColor) {
          excalidrawAPI.updateScene({
            appState: {
              viewBackgroundColor: wb.app_state.viewBackgroundColor,
            },
          });
        }
      }
      setLoadDialogOpen(false);
      toast.success(`Loaded "${wb.title}"`);
    } catch {
      toast.error("Failed to load whiteboard");
    }
  };

  const handleNew = () => {
    setCurrentId(null);
    setTitle("Untitled Whiteboard");
    if (excalidrawAPI) {
      excalidrawAPI.resetScene();
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    if (!user) {
      toast.error("Please log in to use AI generation");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-diagram", {
        body: { prompt: aiPrompt, diagramType },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.elements && excalidrawAPI) {
        const existingElements = excalidrawAPI.getSceneElements();
        excalidrawAPI.updateScene({
          elements: [...existingElements, ...data.elements],
        });

        // Award XP
        try {
          await supabase.rpc("award_xp", {
            p_user_id: user.id,
            p_amount: 25,
            p_source: "whiteboard_ai_generate",
          });
          toast.success("Diagram generated! +25 XP");
        } catch {
          toast.success("Diagram generated!");
        }
      }

      setAiDialogOpen(false);
      setAiPrompt("");
    } catch (err) {
      toast.error("Failed to generate diagram");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!excalidrawAPI) return;
    try {
      const blob = await (await import("@excalidraw/excalidraw")).exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: { ...excalidrawAPI.getAppState(), exportWithDarkMode: true },
        files: excalidrawAPI.getFiles(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as PNG");
    } catch {
      toast.error("Failed to export");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] whiteboard-container">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card/50">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-[200px] h-7 text-xs bg-background"
        />

        {/* Canvas Background Color Picker */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-muted-foreground hidden sm:inline">BG:</span>
          {[
            { color: "#ffffff", label: "White" },
            { color: "#fff8f0", label: "Cream" },
            { color: "#fef3e2", label: "Peach" },
            { color: "#f5f0e8", label: "Warm Beige" },
            { color: "#f0f4f8", label: "Light Blue" },
            { color: "#f0fdf4", label: "Mint" },
            { color: "#1e1e2e", label: "Dark" },
            { color: "#0f172a", label: "Slate" },
          ].map((bg) => (
            <button
              key={bg.color}
              title={bg.label}
              className="w-5 h-5 rounded-sm border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: bg.color }}
              onClick={() => {
                if (excalidrawAPI) {
                  excalidrawAPI.updateScene({
                    appState: { viewBackgroundColor: bg.color },
                  });
                }
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleNew}>
            New
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </Button>

          {/* Load Dialog */}
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                <FolderOpen className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Load</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load Whiteboard</DialogTitle>
              </DialogHeader>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : whiteboards.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No saved whiteboards yet.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {whiteboards.map((wb) => (
                    <div
                      key={wb.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleLoad(wb.id)}
                    >
                      <div>
                        <p className="text-sm font-medium">{wb.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(wb.updated_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWhiteboard(wb.id).then(() => toast.success("Deleted"));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* AI Generate Dialog */}
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs px-2 bg-primary">
                <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">AI Generate</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Diagram with AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Diagram Type</label>
                  <Select value={diagramType} onValueChange={setDiagramType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flowchart">Flowchart</SelectItem>
                      <SelectItem value="mindmap">Mind Map</SelectItem>
                      <SelectItem value="diagram">General Diagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Describe your diagram</label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. A flowchart showing the water cycle process..."
                    className="mt-1.5"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          theme="light"
          onChange={scheduleAutoSave}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveAsImage: false,
            },
          }}
          initialData={{
            appState: {
              viewBackgroundColor: "#0f172a",
            },
          }}
        />
        {user?.id && (
          <WhiteboardListener
            userId={user.id}
            onElementsReceived={handleAgentDraw}
          />
        )}
      </div>
    </div>
  );
}

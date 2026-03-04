import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Summary {
  id: string;
  user_id: string;
  title: string;
  original_text: string;
  summary_text: string;
  summary_type: string;
  word_count: number;
  compression_ratio: number;
  created_at: string;
}

export function useSummaries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchSummaries = useCallback(async () => {
    if (!user) {
      setSummaries([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSummaries((data as Summary[]) ?? []);
    } catch (err: any) {
      console.error("Failed to fetch summaries:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const generateSummary = useCallback(
    async (inputText: string, mode: string) => {
      if (!user) {
        toast({ title: "Please log in", description: "You must be logged in to generate summaries.", variant: "destructive" });
        return null;
      }
      setGenerating(true);
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "generate-summary",
          { body: { input_text: inputText, mode } }
        );

        if (fnError) throw fnError;
        if (fnData?.error) throw new Error(fnData.error);

        const { summary, word_count, compression_ratio } = fnData;

        // Build a title from first 60 chars
        const title = inputText.slice(0, 60).replace(/\s+/g, " ").trim() + (inputText.length > 60 ? "…" : "");

        // Save to DB
        const { data: inserted, error: insertError } = await supabase
          .from("summaries")
          .insert({
            user_id: user.id,
            title,
            original_text: inputText,
            summary_text: summary,
            summary_type: mode,
            word_count,
            compression_ratio,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newSummary = inserted as Summary;
        setSummaries((prev) => [newSummary, ...prev]);

        toast({ title: "Summary generated", description: "Your summary has been saved." });

        return { summary, word_count, compression_ratio };
      } catch (err: any) {
        console.error("Generate summary error:", err);
        toast({
          title: "Generation failed",
          description: err.message || "Something went wrong.",
          variant: "destructive",
        });
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [user, toast]
  );

  const deleteSummary = useCallback(
    async (id: string) => {
      // Optimistic
      const prev = summaries;
      setSummaries((s) => s.filter((item) => item.id !== id));
      try {
        const { error } = await supabase.from("summaries").delete().eq("id", id);
        if (error) throw error;
        toast({ title: "Deleted", description: "Summary removed." });
      } catch {
        setSummaries(prev);
        toast({ title: "Error", description: "Failed to delete summary.", variant: "destructive" });
      }
    },
    [summaries, toast]
  );

  return {
    summaries,
    loading,
    generating,
    fetchSummaries,
    generateSummary,
    deleteSummary,
  };
}

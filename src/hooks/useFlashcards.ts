import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FlashcardSetRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  card_count?: number;
}

export interface FlashcardRow {
  id: string;
  set_id: string;
  front_text: string;
  back_text: string;
  position: number;
}

export interface GenerationHistoryRow {
  id: string;
  user_id: string;
  input_text: string | null;
  source_type: string;
  source_filename: string | null;
  output_data: any;
  card_count: number;
  created_at: string;
}

export function useFlashcards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSetRow[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFlashcardSets = useCallback(async () => {
    if (!user) return;
    const { data: sets } = await supabase
      .from("flashcard_sets" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (sets) {
      // Get card counts
      const setsWithCounts = await Promise.all(
        (sets as any[]).map(async (set: any) => {
          const { count } = await supabase
            .from("flashcards" as any)
            .select("*", { count: "exact", head: true })
            .eq("set_id", set.id);
          return { ...set, card_count: count || 0 };
        })
      );
      setFlashcardSets(setsWithCounts as FlashcardSetRow[]);
    }
  }, [user]);

  const createFlashcardSet = async (
    title: string,
    cards: Array<{ front: string; back: string }>,
    description?: string
  ) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data: set, error: setError } = await supabase
        .from("flashcard_sets" as any)
        .insert({ user_id: user.id, title, description: description || null })
        .select()
        .single();

      if (setError || !set) throw setError;

      const flashcardRows = cards.map((c, i) => ({
        set_id: (set as any).id,
        front_text: c.front,
        back_text: c.back,
        position: i,
      }));

      const { error: cardsError } = await supabase
        .from("flashcards" as any)
        .insert(flashcardRows);

      if (cardsError) throw cardsError;

      toast({ title: "Flashcard set saved!" });
      await loadFlashcardSets();
      return set;
    } catch (err) {
      console.error("Error saving set:", err);
      toast({ title: "Failed to save", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteFlashcardSet = async (setId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("flashcard_sets" as any)
      .delete()
      .eq("id", setId);

    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Set deleted" });
      setFlashcardSets((prev) => prev.filter((s) => s.id !== setId));
    }
  };

  const loadFlashcardsForSet = async (setId: string): Promise<FlashcardRow[]> => {
    const { data } = await supabase
      .from("flashcards" as any)
      .select("*")
      .eq("set_id", setId)
      .order("position", { ascending: true });
    return (data as any as FlashcardRow[]) || [];
  };

  const loadGenerationHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("generation_history" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setGenerationHistory(data as any as GenerationHistoryRow[]);
  }, [user]);

  const saveGenerationHistory = async (entry: {
    input_text?: string;
    source_type: string;
    source_filename?: string;
    output_data: any;
    card_count: number;
  }) => {
    if (!user) return;
    await supabase.from("generation_history" as any).insert({
      user_id: user.id,
      input_text: entry.input_text || null,
      source_type: entry.source_type,
      source_filename: entry.source_filename || null,
      output_data: entry.output_data,
      card_count: entry.card_count,
    });
    await loadGenerationHistory();
  };

  const deleteGenerationHistory = async (id: string) => {
    await supabase.from("generation_history" as any).delete().eq("id", id);
    setGenerationHistory((prev) => prev.filter((h) => h.id !== id));
    toast({ title: "History entry deleted" });
  };

  useEffect(() => {
    if (user) {
      loadFlashcardSets();
      loadGenerationHistory();
    } else {
      setFlashcardSets([]);
      setGenerationHistory([]);
    }
  }, [user, loadFlashcardSets, loadGenerationHistory]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`flashcard-sets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'flashcard_sets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadFlashcardSets();
          toast({ title: "Aria created new flashcards!", description: "Check your Saved Sets below." });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFlashcardSets, toast]);

  return {
    flashcardSets,
    generationHistory,
    loading,
    loadFlashcardSets,
    createFlashcardSet,
    deleteFlashcardSet,
    loadFlashcardsForSet,
    saveGenerationHistory,
    loadGenerationHistory,
    deleteGenerationHistory,
  };
}

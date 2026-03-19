import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Whiteboard {
  id: string;
  user_id: string;
  title: string;
  elements: any[];
  app_state: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useWhiteboards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const whiteboardsQuery = useQuery({
    queryKey: ["whiteboards", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whiteboards")
        .select("id, title, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Pick<Whiteboard, "id" | "title" | "created_at" | "updated_at">[];
    },
    enabled: !!user,
  });

  const loadWhiteboard = async (id: string): Promise<Whiteboard> => {
    const { data, error } = await supabase
      .from("whiteboards")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Whiteboard;
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      elements,
      app_state,
    }: {
      id?: string;
      title: string;
      elements: any[];
      app_state: Record<string, any>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (id) {
        const { data, error } = await supabase
          .from("whiteboards")
          .update({ title, elements: elements as any, app_state: app_state as any })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as unknown as Whiteboard, isNew: false };
      } else {
        const { data, error } = await supabase
          .from("whiteboards")
          .insert({ user_id: user.id, title, elements: elements as any, app_state: app_state as any })
          .select()
          .single();
        if (error) throw error;
        return { data: data as unknown as Whiteboard, isNew: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whiteboards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboards"] });
    },
  });

  return {
    whiteboards: whiteboardsQuery.data ?? [],
    isLoading: whiteboardsQuery.isLoading,
    loadWhiteboard,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteWhiteboard: deleteMutation.mutateAsync,
  };
}

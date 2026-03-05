import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useGoogleCalendar() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!user || !session) {
      setConnected(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "check_connection" },
      });

      if (!error && data?.connected) {
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Check URL params for connection result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("gcal_connected")) {
      setConnected(true);
      toast({ title: "Google Calendar connected!", description: "You can now sync your study sessions." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.has("gcal_error")) {
      const error = params.get("gcal_error");
      toast({
        title: "Connection failed",
        description: `Could not connect to Google Calendar: ${error}`,
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  const connect = async () => {
    if (!session) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "get_auth_url" },
        headers: {
          "origin": window.location.origin,
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Failed to get auth URL");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Connect error:", err);
      toast({
        title: "Connection error",
        description: err instanceof Error ? err.message : "Failed to connect",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "disconnect" },
      });

      if (error) throw error;

      setConnected(false);
      toast({ title: "Disconnected from Google Calendar" });
    } catch (err) {
      console.error("Disconnect error:", err);
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const syncSessions = async () => {
    if (!connected) {
      toast({ title: "Connect Google Calendar first", variant: "destructive" });
      return;
    }

    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {});

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Sync complete!",
        description: data.message || `Synced ${data.synced} sessions`,
      });
    } catch (err) {
      console.error("Sync error:", err);
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return {
    connected,
    loading,
    syncing,
    connect,
    disconnect,
    syncSessions,
    checkConnection,
  };
}

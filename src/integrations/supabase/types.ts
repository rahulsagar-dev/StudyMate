export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_assistant_chats: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          mode: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id?: string
          created_at?: string
          id?: string
          message: string
          mode?: string
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          mode?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_error_logs: {
        Row: {
          created_at: string
          error_message: string
          feature: string
          id: string
          input_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          feature: string
          id?: string
          input_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          feature?: string
          id?: string
          input_text?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          parsed_at: string | null
          processing_status: string
          text_length: number | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          id?: string
          parsed_at?: string | null
          processing_status?: string
          text_length?: number | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          parsed_at?: string | null
          processing_status?: string
          text_length?: number | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      flashcard_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back_text: string
          front_text: string
          id: string
          position: number
          set_id: string
        }
        Insert: {
          back_text: string
          front_text: string
          id?: string
          position?: number
          set_id: string
        }
        Update: {
          back_text?: string
          front_text?: string
          id?: string
          position?: number
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "flashcard_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_history: {
        Row: {
          card_count: number
          created_at: string
          id: string
          input_text: string | null
          output_data: Json
          source_filename: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          card_count?: number
          created_at?: string
          id?: string
          input_text?: string | null
          output_data?: Json
          source_filename?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          card_count?: number
          created_at?: string
          id?: string
          input_text?: string | null
          output_data?: Json
          source_filename?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string | null
          id: string
          refresh_token: string
          token_expiry: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          refresh_token: string
          token_expiry: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          cycle_position: number
          id: string
          session_length: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          cycle_position?: number
          id?: string
          session_length?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          cycle_position?: number
          id?: string
          session_length?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          username: string | null
          weekly_goal_xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          id: string
          last_activity_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          username?: string | null
          weekly_goal_xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          username?: string | null
          weekly_goal_xp?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          difficulty: string
          id: string
          incorrect_answers: number
          quiz_mode: string
          quiz_topic: string
          score: number
          skipped_answers: number
          time_taken: number | null
          total_questions: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          difficulty?: string
          id?: string
          incorrect_answers?: number
          quiz_mode?: string
          quiz_topic: string
          score?: number
          skipped_answers?: number
          time_taken?: number | null
          total_questions?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          difficulty?: string
          id?: string
          incorrect_answers?: number
          quiz_mode?: string
          quiz_topic?: string
          score?: number
          skipped_answers?: number
          time_taken?: number | null
          total_questions?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      quiz_bookmarks: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          question_text: string
          topic: string | null
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          question_text: string
          topic?: string | null
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          question_text?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_question_attempts: {
        Row: {
          answered_at: string | null
          attempt_id: string
          confidence: string | null
          correct_answer: string
          id: string
          is_correct: boolean
          question_text: string
          question_type: string
          selected_answer: string | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          confidence?: string | null
          correct_answer: string
          id?: string
          is_correct?: boolean
          question_text: string
          question_type?: string
          selected_answer?: string | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          confidence?: string | null
          correct_answer?: string
          id?: string
          is_correct?: boolean
          question_text?: string
          question_type?: string
          selected_answer?: string | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_attempts_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      study_activity: {
        Row: {
          active_minutes: number
          created_at: string
          date: string
          id: string
          pomodoro_sessions: number
          productivity_score: number
          user_id: string
        }
        Insert: {
          active_minutes?: number
          created_at?: string
          date?: string
          id?: string
          pomodoro_sessions?: number
          productivity_score?: number
          user_id: string
        }
        Update: {
          active_minutes?: number
          created_at?: string
          date?: string
          id?: string
          pomodoro_sessions?: number
          productivity_score?: number
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          date: string
          id: string
          study_minutes: number
          tasks_completed: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          study_minutes?: number
          tasks_completed?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          study_minutes?: number
          tasks_completed?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          compression_ratio: number
          created_at: string
          id: string
          original_text: string
          summary_text: string
          summary_type: string
          title: string
          user_id: string
          word_count: number
        }
        Insert: {
          compression_ratio?: number
          created_at?: string
          id?: string
          original_text: string
          summary_text: string
          summary_type?: string
          title?: string
          user_id: string
          word_count?: number
        }
        Update: {
          compression_ratio?: number
          created_at?: string
          id?: string
          original_text?: string
          summary_text?: string
          summary_type?: string
          title?: string
          user_id?: string
          word_count?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          subject: string
          title: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          subject?: string
          title: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          subject?: string
          title?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          p_amount: number
          p_source: string
          p_source_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      complete_task: { Args: { p_task_id: string }; Returns: undefined }
      uncomplete_task: { Args: { p_task_id: string }; Returns: undefined }
      update_streak: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

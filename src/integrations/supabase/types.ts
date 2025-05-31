export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_costs: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"] | null
          completion_tokens: number | null
          cost_usd: number | null
          created_at: string | null
          function_name: string
          id: string
          model_used: string | null
          prompt_tokens: number | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["prompt_category"] | null
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string | null
          function_name: string
          id?: string
          model_used?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prompt_category"] | null
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string | null
          function_name?: string
          id?: string
          model_used?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          id: string
          usage_count: number | null
          usage_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          usage_count?: number | null
          usage_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          usage_count?: number | null
          usage_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      care_relationships: {
        Row: {
          approved_at: string | null
          caretaker_id: string
          caretaker_type: Database["public"]["Enums"]["caretaker_type"]
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          notes: string | null
          permission_level: Database["public"]["Enums"]["permission_level"]
          status: Database["public"]["Enums"]["relationship_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          caretaker_id: string
          caretaker_type?: Database["public"]["Enums"]["caretaker_type"]
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          notes?: string | null
          permission_level?: Database["public"]["Enums"]["permission_level"]
          status?: Database["public"]["Enums"]["relationship_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          caretaker_id?: string
          caretaker_type?: Database["public"]["Enums"]["caretaker_type"]
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          notes?: string | null
          permission_level?: Database["public"]["Enums"]["permission_level"]
          status?: Database["public"]["Enums"]["relationship_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_relationships_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_relationships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caretaker_notes: {
        Row: {
          author_id: string
          care_relationship_id: string
          created_at: string
          id: string
          is_visible_to_user: boolean | null
          note_text: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          care_relationship_id: string
          created_at?: string
          id?: string
          is_visible_to_user?: boolean | null
          note_text: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          care_relationship_id?: string
          created_at?: string
          id?: string
          is_visible_to_user?: boolean | null
          note_text?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caretaker_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caretaker_notes_care_relationship_id_fkey"
            columns: ["care_relationship_id"]
            isOneToOne: false
            referencedRelation: "care_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      food_entries: {
        Row: {
          calories: number | null
          created_at: string | null
          description: string | null
          extracted_nutrients: Json | null
          id: string
          image_url: string | null
          ingredients: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string | null
          description?: string | null
          extracted_nutrients?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string | null
          description?: string | null
          extracted_nutrients?: Json | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"]
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          system_prompt: string
          updated_at: string | null
          user_prompt_template: string
        }
        Insert: {
          category: Database["public"]["Enums"]["prompt_category"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          system_prompt: string
          updated_at?: string | null
          user_prompt_template: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          system_prompt?: string
          updated_at?: string | null
          user_prompt_template?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          items: Json | null
          receipt_date: string | null
          tags: string[] | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          receipt_date?: string | null
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          receipt_date?: string | null
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          set_by_caretaker_id: string | null
          status: string | null
          target_date: string | null
          target_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type: string
          id?: string
          set_by_caretaker_id?: string | null
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          set_by_caretaker_id?: string | null
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_set_by_caretaker_id_fkey"
            columns: ["set_by_caretaker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_subscribed: boolean | null
          role: string | null
          subscription_id: string | null
          trial_used_today: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_subscribed?: boolean | null
          role?: string | null
          subscription_id?: string | null
          trial_used_today?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_subscribed?: boolean | null
          role?: string | null
          subscription_id?: string | null
          trial_used_today?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          duration: number | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
          workout_type: Database["public"]["Enums"]["workout_type_enum"] | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
          workout_type?: Database["public"]["Enums"]["workout_type_enum"] | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          workout_type?: Database["public"]["Enums"]["workout_type_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      caretaker_type:
        | "dietitian"
        | "family_member"
        | "healthcare_provider"
        | "personal_trainer"
      permission_level: "view_only" | "interactive" | "full_access"
      prompt_category: "food" | "receipt" | "workout" | "general"
      relationship_status: "pending" | "active" | "inactive" | "rejected"
      workout_type_enum:
        | "cardio"
        | "strength"
        | "flexibility"
        | "sports"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      caretaker_type: [
        "dietitian",
        "family_member",
        "healthcare_provider",
        "personal_trainer",
      ],
      permission_level: ["view_only", "interactive", "full_access"],
      prompt_category: ["food", "receipt", "workout", "general"],
      relationship_status: ["pending", "active", "inactive", "rejected"],
      workout_type_enum: [
        "cardio",
        "strength",
        "flexibility",
        "sports",
        "other",
      ],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          claim_type: string | null
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          passage_id: string
          project_id: string
          source_text: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          claim_type?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          passage_id: string
          project_id: string
          source_text?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          claim_type?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          passage_id?: string
          project_id?: string
          source_text?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          annotation: string | null
          created_at: string
          edge_type: string
          id: string
          project_id: string
          source_node_id: string
          strength: number | null
          target_node_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation?: string | null
          created_at?: string
          edge_type: string
          id?: string
          project_id: string
          source_node_id: string
          strength?: number | null
          target_node_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation?: string | null
          created_at?: string
          edge_type?: string
          id?: string
          project_id?: string
          source_node_id?: string
          strength?: number | null
          target_node_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          color: string | null
          concept_source: string | null
          confidence_score: number | null
          content: string | null
          created_at: string
          extraction_method: string | null
          id: string
          node_type: string
          notebook_id: string | null
          passage_id: string | null
          position_x: number | null
          position_y: number | null
          project_id: string
          size: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          concept_source?: string | null
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          node_type: string
          notebook_id?: string | null
          passage_id?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
          size?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          concept_source?: string | null
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          node_type?: string
          notebook_id?: string | null
          passage_id?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          size?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_nodes_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_nodes_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_resources: {
        Row: {
          created_at: string
          file_size: string | null
          file_type: string | null
          id: string
          notebook_id: string
          project_id: string
          source_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: string | null
          file_type?: string | null
          id?: string
          notebook_id: string
          project_id: string
          source_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: string | null
          file_type?: string | null
          id?: string
          notebook_id?: string
          project_id?: string
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notebooks: {
        Row: {
          briefing: string | null
          created_at: string
          id: string
          notebook_url: string | null
          project_id: string
          title: string
          updated_at: string
          upload_count: number | null
          user_id: string
        }
        Insert: {
          briefing?: string | null
          created_at?: string
          id?: string
          notebook_url?: string | null
          project_id: string
          title: string
          updated_at?: string
          upload_count?: number | null
          user_id: string
        }
        Update: {
          briefing?: string | null
          created_at?: string
          id?: string
          notebook_url?: string | null
          project_id?: string
          title?: string
          updated_at?: string
          upload_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      passages: {
        Row: {
          content: string
          created_at: string
          id: string
          notebook_id: string
          page_number: number | null
          project_id: string
          source_file: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          notebook_id: string
          page_number?: number | null
          project_id: string
          source_file?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          notebook_id?: string
          page_number?: number | null
          project_id?: string
          source_file?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "passages_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          institution: string | null
          research_area: string | null
          title: string | null
          total_prompts_copied: number | null
          total_templates_copied: number | null
          updated_at: string
          user_id: string
          weekly_streak: number | null
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          institution?: string | null
          research_area?: string | null
          title?: string | null
          total_prompts_copied?: number | null
          total_templates_copied?: number | null
          updated_at?: string
          user_id: string
          weekly_streak?: number | null
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          institution?: string | null
          research_area?: string | null
          title?: string | null
          total_prompts_copied?: number | null
          total_templates_copied?: number | null
          updated_at?: string
          user_id?: string
          weekly_streak?: number | null
          xp_points?: number | null
        }
        Relationships: []
      }
      project_workflow_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          insights: string | null
          is_completed: boolean | null
          notes: string | null
          project_id: string
          stage_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          insights?: string | null
          is_completed?: boolean | null
          notes?: string | null
          project_id: string
          stage_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          insights?: string | null
          is_completed?: boolean | null
          notes?: string | null
          project_id?: string
          stage_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_workflow_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workflow_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          hypothesis: string | null
          id: string
          paper_type: string
          structural_outline: Json | null
          theme: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hypothesis?: string | null
          id?: string
          paper_type: string
          structural_outline?: Json | null
          theme?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hypothesis?: string | null
          id?: string
          paper_type?: string
          structural_outline?: Json | null
          theme?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category: string
          content: string
          copy_count: number
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          dislike_count: number | null
          estimated_time: string | null
          id: string
          is_featured: boolean | null
          like_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          copy_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          dislike_count?: number | null
          estimated_time?: string | null
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          copy_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          dislike_count?: number | null
          estimated_time?: string | null
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          content: string
          copy_count: number
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number | null
          file_size: string | null
          file_type: string | null
          id: string
          is_featured: boolean | null
          like_count: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          copy_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: string | null
          file_type?: string | null
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          copy_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: string | null
          file_type?: string | null
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_workflows: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          workflow_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          workflow_data: Json
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          workflow_data?: Json
        }
        Relationships: []
      }
      workflow_prompts: {
        Row: {
          created_at: string
          expected_output: string | null
          id: string
          order_index: number
          prompt_content: string
          prompt_title: string
          stage_name: string
        }
        Insert: {
          created_at?: string
          expected_output?: string | null
          id?: string
          order_index: number
          prompt_content: string
          prompt_title: string
          stage_name: string
        }
        Update: {
          created_at?: string
          expected_output?: string | null
          id?: string
          order_index?: number
          prompt_content?: string
          prompt_title?: string
          stage_name?: string
        }
        Relationships: []
      }
      workflow_stages: {
        Row: {
          created_at: string
          description: string
          estimated_time: string | null
          id: string
          name: string
          order_index: number
          paper_type: string
          prompt_templates: Json | null
          theme: string | null
        }
        Insert: {
          created_at?: string
          description: string
          estimated_time?: string | null
          id?: string
          name: string
          order_index: number
          paper_type: string
          prompt_templates?: Json | null
          theme?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          estimated_time?: string | null
          id?: string
          name?: string
          order_index?: number
          paper_type?: string
          prompt_templates?: Json | null
          theme?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
          workflow_data: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          workflow_data: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          workflow_data?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          title: string;
          difficulty: "Easy" | "Medium" | "Hard";
          title_slug: string;
          question_frontend_id: number;
          ac_rate: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          difficulty: "Easy" | "Medium" | "Hard";
          title_slug: string;
          question_frontend_id: number;
          ac_rate?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          difficulty?: "Easy" | "Medium" | "Hard";
          title_slug?: string;
          question_frontend_id?: number;
          ac_rate?: number | null;
          created_at?: string;
        };
      };
      topics: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      question_topics: {
        Row: {
          question_id: string;
          topic_id: string;
        };
        Insert: {
          question_id: string;
          topic_id: string;
        };
        Update: {
          question_id?: string;
          topic_id?: string;
        };
      };
      user_schedule: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          status: "new" | "learning" | "reviewing" | "mastered";
          next_review_at: string;
          interval_days: number;
          ease_factor: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          status: "new" | "learning" | "reviewing" | "mastered";
          next_review_at: string;
          interval_days?: number;
          ease_factor?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          status?: "new" | "learning" | "reviewing" | "mastered";
          next_review_at?: string;
          interval_days?: number;
          ease_factor?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      track_study_list: {
        Args: {
          p_user_id: string;
          p_study_list_id: string;
        };
        Returns: void;
      };
      search_questions: {
        Args: {
          search_term: string;
          similarity_threshold: number;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"][];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

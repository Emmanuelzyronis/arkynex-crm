export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_actions: {
        Row: {
          action_type: string;
          agent_id: string;
          body: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          deal_id: string | null;
          dismissed: boolean;
          generated_date: string;
          id: string;
          lead_id: string | null;
          priority: string;
          suggested_message: string | null;
          title: string;
        };
        Insert: {
          action_type: string;
          agent_id: string;
          body: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          deal_id?: string | null;
          dismissed?: boolean;
          generated_date?: string;
          id?: string;
          lead_id?: string | null;
          priority: string;
          suggested_message?: string | null;
          title: string;
        };
        Update: {
          action_type?: string;
          agent_id?: string;
          body?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          deal_id?: string | null;
          dismissed?: boolean;
          generated_date?: string;
          id?: string;
          lead_id?: string | null;
          priority?: string;
          suggested_message?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_actions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_actions_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_actions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      communications: {
        Row: {
          agent_id: string;
          call_outcome: string | null;
          channel: string;
          content: string | null;
          created_at: string;
          direction: string | null;
          duration_seconds: number | null;
          id: string;
          lead_id: string;
          wa_status: string | null;
          whatsapp_message_id: string | null;
        };
        Insert: {
          agent_id: string;
          call_outcome?: string | null;
          channel: string;
          content?: string | null;
          created_at?: string;
          direction?: string | null;
          duration_seconds?: number | null;
          id?: string;
          lead_id: string;
          wa_status?: string | null;
          whatsapp_message_id?: string | null;
        };
        Update: {
          agent_id?: string;
          call_outcome?: string | null;
          channel?: string;
          content?: string | null;
          created_at?: string;
          direction?: string | null;
          duration_seconds?: number | null;
          id?: string;
          lead_id?: string;
          wa_status?: string | null;
          whatsapp_message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "communications_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_offers: {
        Row: {
          amount: number;
          created_at: string;
          deal_id: string;
          id: string;
          notes: string | null;
          offered_by: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          deal_id: string;
          id?: string;
          notes?: string | null;
          offered_by: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          deal_id?: string;
          id?: string;
          notes?: string | null;
          offered_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_offers_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          agency_cut_pct: number | null;
          agent_id: string;
          agent_net_commission: number | null;
          agreed_price: number | null;
          asking_price: number;
          closing_probability: number | null;
          co_agent_id: string | null;
          co_agent_split_pct: number | null;
          commission_amount: number | null;
          commission_rate: number;
          created_at: string;
          expected_close_date: string | null;
          id: string;
          lead_id: string;
          notes: string | null;
          property_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          agency_cut_pct?: number | null;
          agent_id: string;
          agent_net_commission?: number | null;
          agreed_price?: number | null;
          asking_price: number;
          closing_probability?: number | null;
          co_agent_id?: string | null;
          co_agent_split_pct?: number | null;
          commission_amount?: number | null;
          commission_rate?: number;
          created_at?: string;
          expected_close_date?: string | null;
          id?: string;
          lead_id: string;
          notes?: string | null;
          property_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          agency_cut_pct?: number | null;
          agent_id?: string;
          agent_net_commission?: number | null;
          agreed_price?: number | null;
          asking_price?: number;
          closing_probability?: number | null;
          co_agent_id?: string | null;
          co_agent_split_pct?: number | null;
          commission_amount?: number | null;
          commission_rate?: number;
          created_at?: string;
          expected_close_date?: string | null;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          property_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_co_agent_id_fkey";
            columns: ["co_agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_stage_history: {
        Row: {
          agent_id: string;
          created_at: string;
          from_stage: string | null;
          id: string;
          lead_id: string;
          notes: string | null;
          to_stage: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          from_stage?: string | null;
          id?: string;
          lead_id: string;
          notes?: string | null;
          to_stage: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          from_stage?: string | null;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          to_stage?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          agent_id: string;
          archived: boolean;
          bedrooms: number | null;
          budget_max: number | null;
          budget_min: number | null;
          company: string | null;
          created_at: string;
          email: string | null;
          embedding: string | null;
          full_name: string;
          id: string;
          last_contacted_at: string | null;
          location_prefs: string[] | null;
          notes: string | null;
          phone: string;
          property_type: string | null;
          raw_intake_text: string | null;
          referred_by_lead_id: string | null;
          score: number;
          source: string;
          stage: string;
          stage_entered_at: string;
          timeline: string | null;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          archived?: boolean;
          bedrooms?: number | null;
          budget_max?: number | null;
          budget_min?: number | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          embedding?: string | null;
          full_name: string;
          id?: string;
          last_contacted_at?: string | null;
          location_prefs?: string[] | null;
          notes?: string | null;
          phone: string;
          property_type?: string | null;
          raw_intake_text?: string | null;
          referred_by_lead_id?: string | null;
          score?: number;
          source?: string;
          stage?: string;
          stage_entered_at?: string;
          timeline?: string | null;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          archived?: boolean;
          bedrooms?: number | null;
          budget_max?: number | null;
          budget_min?: number | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          embedding?: string | null;
          full_name?: string;
          id?: string;
          last_contacted_at?: string | null;
          location_prefs?: string[] | null;
          notes?: string | null;
          phone?: string;
          property_type?: string | null;
          raw_intake_text?: string | null;
          referred_by_lead_id?: string | null;
          score?: number;
          source?: string;
          stage?: string;
          stage_entered_at?: string;
          timeline?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_referred_by_lead_id_fkey";
            columns: ["referred_by_lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          agency_name: string | null;
          created_at: string;
          full_name: string;
          id: string;
          onboarded_at: string | null;
          onboarding_step: number;
          paystack_customer_code: string | null;
          phone: string | null;
          subscription_status: string;
          tier: string;
          timezone: string;
          trial_ends_at: string | null;
          updated_at: string;
          whatsapp_pairing_code: string | null;
          whatsapp_pairing_expires: string | null;
          whatsapp_phone: string | null;
          whatsapp_verified_at: string | null;
        };
        Insert: {
          agency_name?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          onboarded_at?: string | null;
          onboarding_step?: number;
          paystack_customer_code?: string | null;
          phone?: string | null;
          subscription_status?: string;
          tier?: string;
          timezone?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          whatsapp_pairing_code?: string | null;
          whatsapp_pairing_expires?: string | null;
          whatsapp_phone?: string | null;
          whatsapp_verified_at?: string | null;
        };
        Update: {
          agency_name?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          onboarded_at?: string | null;
          onboarding_step?: number;
          paystack_customer_code?: string | null;
          phone?: string | null;
          subscription_status?: string;
          tier?: string;
          timezone?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          whatsapp_pairing_code?: string | null;
          whatsapp_pairing_expires?: string | null;
          whatsapp_phone?: string | null;
          whatsapp_verified_at?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address: string | null;
          agent_id: string;
          amenities: string[] | null;
          area: string | null;
          bathrooms: number | null;
          bedrooms: number | null;
          city: string;
          commission_split_pct: number | null;
          condition: string | null;
          created_at: string;
          description: string | null;
          embedding: string | null;
          external_agent_name: string | null;
          external_agent_phone: string | null;
          furnishing: string | null;
          id: string;
          inquiry_count: number;
          latitude: number | null;
          listed_at: string;
          longitude: number | null;
          ownership: string;
          price: number;
          property_type: string;
          size_sqm: number | null;
          status: string;
          title: string;
          updated_at: string;
          viewing_count: number;
        };
        Insert: {
          address?: string | null;
          agent_id: string;
          amenities?: string[] | null;
          area?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          city?: string;
          commission_split_pct?: number | null;
          condition?: string | null;
          created_at?: string;
          description?: string | null;
          embedding?: string | null;
          external_agent_name?: string | null;
          external_agent_phone?: string | null;
          furnishing?: string | null;
          id?: string;
          inquiry_count?: number;
          latitude?: number | null;
          listed_at?: string;
          longitude?: number | null;
          ownership?: string;
          price: number;
          property_type: string;
          size_sqm?: number | null;
          status?: string;
          title: string;
          updated_at?: string;
          viewing_count?: number;
        };
        Update: {
          address?: string | null;
          agent_id?: string;
          amenities?: string[] | null;
          area?: string | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          city?: string;
          commission_split_pct?: number | null;
          condition?: string | null;
          created_at?: string;
          description?: string | null;
          embedding?: string | null;
          external_agent_name?: string | null;
          external_agent_phone?: string | null;
          furnishing?: string | null;
          id?: string;
          inquiry_count?: number;
          latitude?: number | null;
          listed_at?: string;
          longitude?: number | null;
          ownership?: string;
          price?: number;
          property_type?: string;
          size_sqm?: number | null;
          status?: string;
          title?: string;
          updated_at?: string;
          viewing_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      property_documents: {
        Row: {
          created_at: string;
          doc_type: string;
          id: string;
          label: string | null;
          property_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          doc_type: string;
          id?: string;
          label?: string | null;
          property_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          doc_type?: string;
          id?: string;
          label?: string | null;
          property_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_photos: {
        Row: {
          created_at: string;
          id: string;
          is_primary: boolean;
          property_id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          property_id: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          property_id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          agent_id: string;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          paystack_plan_code: string | null;
          paystack_subscription_code: string | null;
          plan: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          paystack_plan_code?: string | null;
          paystack_subscription_code?: string | null;
          plan: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          paystack_plan_code?: string | null;
          paystack_subscription_code?: string | null;
          plan?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      viewings: {
        Row: {
          agent_id: string;
          agent_notes: string | null;
          created_at: string;
          follow_up_sent_at: string | null;
          id: string;
          lead_id: string;
          lead_reaction: string | null;
          property_id: string;
          rating: number | null;
          reminder_sent_at: string | null;
          scheduled_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          agent_notes?: string | null;
          created_at?: string;
          follow_up_sent_at?: string | null;
          id?: string;
          lead_id: string;
          lead_reaction?: string | null;
          property_id: string;
          rating?: number | null;
          reminder_sent_at?: string | null;
          scheduled_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          agent_notes?: string | null;
          created_at?: string;
          follow_up_sent_at?: string | null;
          id?: string;
          lead_id?: string;
          lead_reaction?: string | null;
          property_id?: string;
          rating?: number | null;
          reminder_sent_at?: string | null;
          scheduled_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "viewings_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "viewings_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "viewings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_logs: {
        Row: {
          created_at: string;
          error: string | null;
          event_type: string | null;
          id: string;
          payload: Json | null;
          processed: boolean;
          source: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          event_type?: string | null;
          id?: string;
          payload?: Json | null;
          processed?: boolean;
          source: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          event_type?: string | null;
          id?: string;
          payload?: Json | null;
          processed?: boolean;
          source?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<
  Name extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[Name] extends { Row: infer R } ? R : never;

export type TablesInsert<Name extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][Name] extends { Insert: infer I } ? I : never;

export type TablesUpdate<Name extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][Name] extends { Update: infer U } ? U : never;

/**
 * Supabase client type compatible with both:
 * - @supabase/ssr createBrowserClient / createServerClient (which pass 3 generic params)
 * - @supabase/supabase-js v2.108.2 SupabaseClient class (which has 5 generic params)
 *
 * The SSR package puts the schema object in the 3rd position, while newer
 * supabase-js expects a string there. Using `any` for the middle params
 * makes the parameter accept either form.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
export type SupaClient = SupabaseClient<Database, any, any>;

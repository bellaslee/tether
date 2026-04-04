export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PersonCategory =
  | "friend"
  | "close_friend"
  | "acquaintance"
  | "networking"
  | "mentor"
  | "family";

export type PersonStatus = "active" | "dormant" | "archived";

export type ContactMethodType =
  | "phone"
  | "email"
  | "instagram"
  | "linkedin"
  | "discord"
  | "address"
  | "other";

export type InteractionType =
  | "hangout"
  | "text"
  | "call"
  | "dinner"
  | "party"
  | "coffee_chat"
  | "meeting"
  | "other";

export type InteractionDirection = "inbound" | "outbound" | "mutual";

export type InteractionPersonRole = "primary" | "attendee";

export interface Database {
  public: {
    Tables: {
      people: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          preferred_name: string | null;
          category: PersonCategory;
          status: PersonStatus;
          birthday: string | null;
          pronouns: string | null;
          location: string | null;
          occupation: string | null;
          company: string | null;
          how_you_met: string | null;
          relationship_context: string | null;
          last_interaction_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          preferred_name?: string | null;
          category: PersonCategory;
          status?: PersonStatus;
          birthday?: string | null;
          pronouns?: string | null;
          location?: string | null;
          occupation?: string | null;
          company?: string | null;
          how_you_met?: string | null;
          relationship_context?: string | null;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          preferred_name?: string | null;
          category?: PersonCategory;
          status?: PersonStatus;
          birthday?: string | null;
          pronouns?: string | null;
          location?: string | null;
          occupation?: string | null;
          company?: string | null;
          how_you_met?: string | null;
          relationship_context?: string | null;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_methods: {
        Row: {
          id: string;
          person_id: string;
          type: ContactMethodType;
          value: string;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          type: ContactMethodType;
          value: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          type?: ContactMethodType;
          value?: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          user_id: string;
          occurred_at: string;
          type: InteractionType;
          direction: InteractionDirection | null;
          title: string | null;
          raw_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          occurred_at: string;
          type: InteractionType;
          direction?: InteractionDirection | null;
          title?: string | null;
          raw_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          occurred_at?: string;
          type?: InteractionType;
          direction?: InteractionDirection | null;
          title?: string | null;
          raw_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interaction_people: {
        Row: {
          interaction_id: string;
          person_id: string;
          role: InteractionPersonRole;
          created_at: string;
        };
        Insert: {
          interaction_id: string;
          person_id: string;
          role?: InteractionPersonRole;
          created_at?: string;
        };
        Update: {
          interaction_id?: string;
          person_id?: string;
          role?: InteractionPersonRole;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

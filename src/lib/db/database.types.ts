export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PersonStatus = 'active' | 'dormant' | 'archived';

export type ContactMethodType =
  | 'phone'
  | 'email'
  | 'instagram'
  | 'linkedin'
  | 'discord'
  | 'address'
  | 'other';

export type InteractionPersonRole = 'primary' | 'attendee';

export type FactReviewStatus = 'candidate' | 'accepted' | 'dismissed';

export type RelationshipSummaryKind = 'profile_brief' | 'next_meeting';

export type CrmTaskStatus =
  | 'suggested'
  | 'active'
  | 'done'
  | 'dismissed'
  | 'snoozed';

export type UsageEventCategory = 'screen' | 'feature' | 'llm';

export interface Database {
  public: {
    Tables: {
      person_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interaction_types: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      connection_types: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          inverse_type_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          inverse_type_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          inverse_type_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      person_connections: {
        Row: {
          id: string;
          user_id: string;
          person_id: string;
          related_person_id: string;
          connection_type_id: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_id: string;
          related_person_id: string;
          connection_type_id: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          person_id?: string;
          related_person_id?: string;
          connection_type_id?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      people: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          display_name: string | null;
          category_id: string;
          status: PersonStatus;
          birthday: string | null;
          pronouns: string | null;
          location: string | null;
          occupation: string | null;
          company: string | null;
          how_you_met: string | null;
          relationship_context: string | null;
          met_at: string | null;
          last_interaction_at: string | null;
          interaction_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          display_name?: string | null;
          category_id: string;
          status?: PersonStatus;
          birthday?: string | null;
          pronouns?: string | null;
          location?: string | null;
          occupation?: string | null;
          company?: string | null;
          how_you_met?: string | null;
          relationship_context?: string | null;
          met_at?: string | null;
          last_interaction_at?: string | null;
          interaction_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          display_name?: string | null;
          category_id?: string;
          status?: PersonStatus;
          birthday?: string | null;
          pronouns?: string | null;
          location?: string | null;
          occupation?: string | null;
          company?: string | null;
          how_you_met?: string | null;
          relationship_context?: string | null;
          met_at?: string | null;
          last_interaction_at?: string | null;
          interaction_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'people_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'person_categories';
            referencedColumns: ['id'];
          },
        ];
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
          interaction_type_id: string;
          title: string | null;
          raw_note: string | null;
          counts_toward_last_touch: boolean;
          memory_ai_input_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          occurred_at: string;
          interaction_type_id: string;
          title?: string | null;
          raw_note?: string | null;
          counts_toward_last_touch?: boolean;
          memory_ai_input_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          occurred_at?: string;
          interaction_type_id?: string;
          title?: string | null;
          raw_note?: string | null;
          counts_toward_last_touch?: boolean;
          memory_ai_input_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interactions_interaction_type_id_fkey';
            columns: ['interaction_type_id'];
            isOneToOne: false;
            referencedRelation: 'interaction_types';
            referencedColumns: ['id'];
          },
        ];
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
      quick_log_presets: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          primary_person_id: string;
          interaction_type_id: string;
          interaction_title: string;
          attendee_person_ids: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          primary_person_id: string;
          interaction_type_id: string;
          interaction_title?: string;
          attendee_person_ids?: string[];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          primary_person_id?: string;
          interaction_type_id?: string;
          interaction_title?: string;
          attendee_person_ids?: string[];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quick_log_presets_primary_person_id_fkey';
            columns: ['primary_person_id'];
            isOneToOne: false;
            referencedRelation: 'people';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quick_log_presets_interaction_type_id_fkey';
            columns: ['interaction_type_id'];
            isOneToOne: false;
            referencedRelation: 'interaction_types';
            referencedColumns: ['id'];
          },
        ];
      };
      facts: {
        Row: {
          id: string;
          user_id: string;
          person_id: string;
          interaction_id: string | null;
          body: string;
          review_status: FactReviewStatus;
          extractor_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_id: string;
          interaction_id?: string | null;
          body: string;
          review_status?: FactReviewStatus;
          extractor_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          person_id?: string;
          interaction_id?: string | null;
          body?: string;
          review_status?: FactReviewStatus;
          extractor_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      relationship_summaries: {
        Row: {
          id: string;
          user_id: string;
          person_id: string;
          kind: RelationshipSummaryKind;
          content: string;
          source_interaction_ids: string[];
          source_fact_ids: string[];
          model_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_id: string;
          kind: RelationshipSummaryKind;
          content: string;
          source_interaction_ids?: string[];
          source_fact_ids?: string[];
          model_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          person_id?: string;
          kind?: RelationshipSummaryKind;
          content?: string;
          source_interaction_ids?: string[];
          source_fact_ids?: string[];
          model_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          person_id: string | null;
          interaction_id: string | null;
          title: string;
          description: string | null;
          status: CrmTaskStatus;
          due_at: string | null;
          snoozed_until: string | null;
          suggester_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_id?: string | null;
          interaction_id?: string | null;
          title: string;
          description?: string | null;
          status?: CrmTaskStatus;
          due_at?: string | null;
          snoozed_until?: string | null;
          suggester_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          person_id?: string | null;
          interaction_id?: string | null;
          title?: string;
          description?: string | null;
          status?: CrmTaskStatus;
          due_at?: string | null;
          snoozed_until?: string | null;
          suggester_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: string;
          user_id: string;
          category: UsageEventCategory;
          name: string;
          properties: Json;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category: UsageEventCategory;
          name: string;
          properties?: Json;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: UsageEventCategory;
          name?: string;
          properties?: Json;
          duration_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      document_embeddings: {
        Row: {
          id: string;
          user_id: string;
          source_type: 'interaction_note' | 'fact';
          source_id: string;
          chunk_index: number;
          content: string;
          person_ids: string[];
          embedding: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: 'interaction_note' | 'fact';
          source_id: string;
          chunk_index?: number;
          content: string;
          person_ids?: string[];
          embedding: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: 'interaction_note' | 'fact';
          source_id?: string;
          chunk_index?: number;
          content?: string;
          person_ids?: string[];
          embedding?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_document_embeddings: {
        Args: {
          query_embedding: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          source_type: string;
          source_id: string;
          chunk_index: number;
          content: string;
          person_ids: string[];
          distance: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * GENERATED FILE — do not edit by hand.
 *
 * Regenerate after every migration:
 *
 *     supabase gen types typescript --linked > lib/database.types.ts
 *
 * This mirrors the applied schema of the hosted project. `lib/db/types.ts` is
 * the hand-written domain shape the application reasons in; this is the wire
 * shape Postgres actually returns.
 */

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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      account_invitations: {
        Row: {
          claim_code: string
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          curriculum_author: boolean
          email: string
          first_name: string
          grade_level: number | null
          id: string
          invited_by_user_id: string | null
          last_name: string
          org_id: string
          revoked_at: string | null
          revoked_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          site_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          claim_code?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          curriculum_author?: boolean
          email: string
          first_name: string
          grade_level?: number | null
          id?: string
          invited_by_user_id?: string | null
          last_name: string
          org_id: string
          revoked_at?: string | null
          revoked_reason?: string | null
          role: Database["public"]["Enums"]["user_role"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          claim_code?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          curriculum_author?: boolean
          email?: string
          first_name?: string
          grade_level?: number | null
          id?: string
          invited_by_user_id?: string | null
          last_name?: string
          org_id?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "account_invitations_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_invitations_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_invitations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_role: Database["public"]["Enums"]["user_role"]
          actor_user_id: string
          after_state: Json | null
          before_state: Json | null
          id: string
          idempotency_key: string
          reason: string
          recorded_at: string
          request_id: string
          scope: string
          target_entity: string
          target_id: string
        }
        Insert: {
          action: string
          actor_role: Database["public"]["Enums"]["user_role"]
          actor_user_id: string
          after_state?: Json | null
          before_state?: Json | null
          id?: string
          idempotency_key: string
          reason: string
          recorded_at?: string
          request_id: string
          scope: string
          target_entity: string
          target_id: string
        }
        Update: {
          action?: string
          actor_role?: Database["public"]["Enums"]["user_role"]
          actor_user_id?: string
          after_state?: Json | null
          before_state?: Json | null
          id?: string
          idempotency_key?: string
          reason?: string
          recorded_at?: string
          request_id?: string
          scope?: string
          target_entity?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      authored_lessons: {
        Row: {
          course_version_id: string
          created_at: string
          goal: string
          guided_practice: Json
          id: string
          independent_task: string
          lesson_code: string
          notes_outline: string[]
          org_id: string
          relevance: string
          success_criteria: string[]
          updated_at: string
          updated_by: string
          vocabulary: Json
          worked_model: Json
        }
        Insert: {
          course_version_id: string
          created_at?: string
          goal?: string
          guided_practice?: Json
          id?: string
          independent_task?: string
          lesson_code: string
          notes_outline?: string[]
          org_id: string
          relevance?: string
          success_criteria?: string[]
          updated_at?: string
          updated_by: string
          vocabulary?: Json
          worked_model?: Json
        }
        Update: {
          course_version_id?: string
          created_at?: string
          goal?: string
          guided_practice?: Json
          id?: string
          independent_task?: string
          lesson_code?: string
          notes_outline?: string[]
          org_id?: string
          relevance?: string
          success_criteria?: string[]
          updated_at?: string
          updated_by?: string
          vocabulary?: Json
          worked_model?: Json
        }
        Relationships: [
          {
            foreignKeyName: "authored_lessons_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authored_lessons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authored_lessons_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_structure_foundations: {
        Row: {
          changed_at: string
          changed_by: string
          course_structure_id: string
          id: string
          importance: number | null
          lesson_code: string
          note: string
          removed: boolean
          target_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          course_structure_id: string
          id?: string
          importance?: number | null
          lesson_code: string
          note?: string
          removed?: boolean
          target_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          course_structure_id?: string
          id?: string
          importance?: number | null
          lesson_code?: string
          note?: string
          removed?: boolean
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_structure_foundations_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_structure_foundations_course_structure_id_fkey"
            columns: ["course_structure_id"]
            isOneToOne: false
            referencedRelation: "course_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      course_structure_units: {
        Row: {
          changed_at: string
          changed_by: string
          course_structure_id: string
          essential_question: string | null
          id: string
          lesson_codes: string[] | null
          title: string | null
          unit_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          course_structure_id: string
          essential_question?: string | null
          id?: string
          lesson_codes?: string[] | null
          title?: string | null
          unit_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          course_structure_id?: string
          essential_question?: string | null
          id?: string
          lesson_codes?: string[] | null
          title?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_structure_units_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_structure_units_course_structure_id_fkey"
            columns: ["course_structure_id"]
            isOneToOne: false
            referencedRelation: "course_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      course_structures: {
        Row: {
          course_id: string
          course_version_id: string
          created_at: string
          id: string
          org_id: string
          unit_order: string[] | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          course_id: string
          course_version_id: string
          created_at?: string
          id?: string
          org_id: string
          unit_order?: string[] | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          course_id?: string
          course_version_id?: string
          created_at?: string
          id?: string
          org_id?: string
          unit_order?: string[] | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_structures_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: true
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_structures_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_structures_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_versions: {
        Row: {
          course_title: string
          created_at: string
          id: string
          notes: string
          org_id: string
          published_at: string | null
          retired_at: string | null
          status: Database["public"]["Enums"]["curriculum_status"]
          version: string
        }
        Insert: {
          course_title: string
          created_at?: string
          id?: string
          notes?: string
          org_id: string
          published_at?: string | null
          retired_at?: string | null
          status?: Database["public"]["Enums"]["curriculum_status"]
          version: string
        }
        Update: {
          course_title?: string
          created_at?: string
          id?: string
          notes?: string
          org_id?: string
          published_at?: string | null
          retired_at?: string | null
          status?: Database["public"]["Enums"]["curriculum_status"]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_title: string
          course_version_id: string
          created_at: string
          id: string
          section_id: string
          started_at: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          transferred_from_enrollment_id: string | null
        }
        Insert: {
          course_title: string
          course_version_id: string
          created_at?: string
          id?: string
          section_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          transferred_from_enrollment_id?: string | null
        }
        Update: {
          course_title?: string
          course_version_id?: string
          created_at?: string
          id?: string
          section_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          transferred_from_enrollment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "roster_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_transferred_from_enrollment_id_fkey"
            columns: ["transferred_from_enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          attempt: number
          correct: boolean | null
          course_version_id: string
          enrollment_id: string
          error_code: string | null
          hints_used: number
          id: string
          item_id: string
          lesson_code: string
          meaningful_minutes: number
          recorded_at: string
          recorded_by_user_id: string
          response: string
          skill: string
          source: Database["public"]["Enums"]["evidence_source"]
          stage: string
          standard: string | null
          student_id: string
          supersedes_evidence_id: string | null
          support_used: string | null
        }
        Insert: {
          attempt?: number
          correct?: boolean | null
          course_version_id: string
          enrollment_id: string
          error_code?: string | null
          hints_used?: number
          id?: string
          item_id: string
          lesson_code: string
          meaningful_minutes?: number
          recorded_at?: string
          recorded_by_user_id: string
          response?: string
          skill: string
          source: Database["public"]["Enums"]["evidence_source"]
          stage: string
          standard?: string | null
          student_id: string
          supersedes_evidence_id?: string | null
          support_used?: string | null
        }
        Update: {
          attempt?: number
          correct?: boolean | null
          course_version_id?: string
          enrollment_id?: string
          error_code?: string | null
          hints_used?: number
          id?: string
          item_id?: string
          lesson_code?: string
          meaningful_minutes?: number
          recorded_at?: string
          recorded_by_user_id?: string
          response?: string
          skill?: string
          source?: Database["public"]["Enums"]["evidence_source"]
          stage?: string
          standard?: string | null
          student_id?: string
          supersedes_evidence_id?: string | null
          support_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_recorded_by_user_id_fkey"
            columns: ["recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_supersedes_evidence_id_fkey"
            columns: ["supersedes_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_supersedes_evidence_id_fkey"
            columns: ["supersedes_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_current"
            referencedColumns: ["id"]
          },
        ]
      }
      export_records: {
        Row: {
          id: string
          purpose: string
          requested_at: string
          requested_by_user_id: string
          row_count: number
          scope: string
        }
        Insert: {
          id?: string
          purpose: string
          requested_at?: string
          requested_by_user_id: string
          row_count: number
          scope: string
        }
        Update: {
          id?: string
          purpose?: string
          requested_at?: string
          requested_by_user_id?: string
          row_count?: number
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_records_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_categories: {
        Row: {
          course_title: string
          id: string
          name: string
          org_id: string
          weight: number
        }
        Insert: {
          course_title: string
          id?: string
          name: string
          org_id: string
          weight: number
        }
        Update: {
          course_title?: string
          id?: string
          name?: string
          org_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_records: {
        Row: {
          assessment_id: string
          category_id: string
          enrollment_id: string
          entered_by_user_id: string
          id: string
          lesson_code: string
          points_earned: number
          points_possible: number
          reason: string
          recorded_at: string
          rule_version: string
          student_id: string
          supersedes_grade_id: string | null
        }
        Insert: {
          assessment_id: string
          category_id: string
          enrollment_id: string
          entered_by_user_id: string
          id?: string
          lesson_code: string
          points_earned: number
          points_possible: number
          reason: string
          recorded_at?: string
          rule_version: string
          student_id: string
          supersedes_grade_id?: string | null
        }
        Update: {
          assessment_id?: string
          category_id?: string
          enrollment_id?: string
          entered_by_user_id?: string
          id?: string
          lesson_code?: string
          points_earned?: number
          points_possible?: number
          reason?: string
          recorded_at?: string
          rule_version?: string
          student_id?: string
          supersedes_grade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "grade_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_entered_by_user_id_fkey"
            columns: ["entered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_supersedes_grade_id_fkey"
            columns: ["supersedes_grade_id"]
            isOneToOne: false
            referencedRelation: "grade_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_supersedes_grade_id_fkey"
            columns: ["supersedes_grade_id"]
            isOneToOne: false
            referencedRelation: "grade_records_current"
            referencedColumns: ["id"]
          },
        ]
      }
      gradebook_configs: {
        Row: {
          course_title: string
          id: string
          org_id: string
          rule_version: string
          scale: Json
        }
        Insert: {
          course_title: string
          id?: string
          org_id: string
          rule_version: string
          scale: Json
        }
        Update: {
          course_title?: string
          id?: string
          org_id?: string
          rule_version?: string
          scale?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gradebook_configs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          key: string
          result_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          key: string
          result_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          key?: string
          result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          created_at: string
          cycles: number
          decided_by_user_id: string | null
          decision_reason: string | null
          due_expectation: string
          enrollment_id: string
          estimated_minutes: number
          evidence_count_at_decision: number
          id: string
          intervention_lesson_id: string
          readiness_min_percent: number
          readiness_percent: number | null
          recommended_by_rule_version: string
          return_lesson_code: string
          return_rule_version: string
          return_stage: number
          severity: Database["public"]["Enums"]["intervention_severity"]
          status: Database["public"]["Enums"]["intervention_status"]
          student_id: string
          target_skill: string
          target_standard: string | null
          transfer_items_required: number
          transfer_passed: boolean | null
          trigger_evidence_ids: string[]
          trigger_summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycles?: number
          decided_by_user_id?: string | null
          decision_reason?: string | null
          due_expectation?: string
          enrollment_id: string
          estimated_minutes: number
          evidence_count_at_decision?: number
          id?: string
          intervention_lesson_id: string
          readiness_min_percent?: number
          readiness_percent?: number | null
          recommended_by_rule_version: string
          return_lesson_code: string
          return_rule_version: string
          return_stage: number
          severity: Database["public"]["Enums"]["intervention_severity"]
          status?: Database["public"]["Enums"]["intervention_status"]
          student_id: string
          target_skill: string
          target_standard?: string | null
          transfer_items_required?: number
          transfer_passed?: boolean | null
          trigger_evidence_ids?: string[]
          trigger_summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycles?: number
          decided_by_user_id?: string | null
          decision_reason?: string | null
          due_expectation?: string
          enrollment_id?: string
          estimated_minutes?: number
          evidence_count_at_decision?: number
          id?: string
          intervention_lesson_id?: string
          readiness_min_percent?: number
          readiness_percent?: number | null
          recommended_by_rule_version?: string
          return_lesson_code?: string
          return_rule_version?: string
          return_stage?: number
          severity?: Database["public"]["Enums"]["intervention_severity"]
          status?: Database["public"]["Enums"]["intervention_status"]
          student_id?: string
          target_skill?: string
          target_standard?: string | null
          transfer_items_required?: number
          transfer_passed?: boolean | null
          trigger_evidence_ids?: string[]
          trigger_summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_decided_by_user_id_fkey"
            columns: ["decided_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_blocks: {
        Row: {
          added_at: string
          added_by: string
          alt: string
          authored_lesson_id: string
          body: string
          caption: string
          headers: string[]
          id: string
          items: string[]
          kind: Database["public"]["Enums"]["lesson_block_kind"]
          material_id: string | null
          meaning: string
          ordered: boolean
          position: number
          rows: Json
          term: string
          title: string
          tone: Database["public"]["Enums"]["callout_tone"] | null
          url: string | null
          video_id: string | null
        }
        Insert: {
          added_at?: string
          added_by: string
          alt?: string
          authored_lesson_id: string
          body?: string
          caption?: string
          headers?: string[]
          id?: string
          items?: string[]
          kind: Database["public"]["Enums"]["lesson_block_kind"]
          material_id?: string | null
          meaning?: string
          ordered?: boolean
          position: number
          rows?: Json
          term?: string
          title?: string
          tone?: Database["public"]["Enums"]["callout_tone"] | null
          url?: string | null
          video_id?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string
          alt?: string
          authored_lesson_id?: string
          body?: string
          caption?: string
          headers?: string[]
          id?: string
          items?: string[]
          kind?: Database["public"]["Enums"]["lesson_block_kind"]
          material_id?: string | null
          meaning?: string
          ordered?: boolean
          position?: number
          rows?: Json
          term?: string
          title?: string
          tone?: Database["public"]["Enums"]["callout_tone"] | null
          url?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_authored_lesson_id_fkey"
            columns: ["authored_lesson_id"]
            isOneToOne: false
            referencedRelation: "authored_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "lesson_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "lesson_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_items: {
        Row: {
          added_at: string
          added_by: string
          authored_lesson_id: string
          choices: Json
          correct_choice_id: string
          id: string
          purpose: Database["public"]["Enums"]["item_purpose"]
          rationale: string
          skill: string
          standard: string
          stem: string
        }
        Insert: {
          added_at?: string
          added_by: string
          authored_lesson_id: string
          choices: Json
          correct_choice_id: string
          id?: string
          purpose: Database["public"]["Enums"]["item_purpose"]
          rationale: string
          skill: string
          standard: string
          stem: string
        }
        Update: {
          added_at?: string
          added_by?: string
          authored_lesson_id?: string
          choices?: Json
          correct_choice_id?: string
          id?: string
          purpose?: Database["public"]["Enums"]["item_purpose"]
          rationale?: string
          skill?: string
          standard?: string
          stem?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_items_authored_lesson_id_fkey"
            columns: ["authored_lesson_id"]
            isOneToOne: false
            referencedRelation: "authored_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          access_note: string
          added_at: string
          added_by: string
          authored_lesson_id: string
          id: string
          kind: Database["public"]["Enums"]["lesson_material_kind"]
          minutes: number | null
          purpose: string
          source: string
          title: string
          url: string
        }
        Insert: {
          access_note: string
          added_at?: string
          added_by: string
          authored_lesson_id: string
          id?: string
          kind: Database["public"]["Enums"]["lesson_material_kind"]
          minutes?: number | null
          purpose: string
          source?: string
          title: string
          url: string
        }
        Update: {
          access_note?: string
          added_at?: string
          added_by?: string
          authored_lesson_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["lesson_material_kind"]
          minutes?: number | null
          purpose?: string
          source?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_materials_authored_lesson_id_fkey"
            columns: ["authored_lesson_id"]
            isOneToOne: false
            referencedRelation: "authored_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_states: {
        Row: {
          attempts: number
          enrollment_id: string
          id: string
          lesson_code: string
          stage: number
          status: Database["public"]["Enums"]["lesson_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          enrollment_id: string
          id?: string
          lesson_code: string
          stage?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          enrollment_id?: string
          id?: string
          lesson_code?: string
          stage?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_states_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_videos: {
        Row: {
          added_at: string
          added_by: string
          authored_lesson_id: string
          captions_url: string | null
          id: string
          minutes: number | null
          source: string
          title: string
          transcript: string
          url: string
        }
        Insert: {
          added_at?: string
          added_by: string
          authored_lesson_id: string
          captions_url?: string | null
          id?: string
          minutes?: number | null
          source?: string
          title: string
          transcript: string
          url: string
        }
        Update: {
          added_at?: string
          added_by?: string
          authored_lesson_id?: string
          captions_url?: string | null
          id?: string
          minutes?: number | null
          source?: string
          title?: string
          transcript?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_videos_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_videos_authored_lesson_id_fkey"
            columns: ["authored_lesson_id"]
            isOneToOne: false
            referencedRelation: "authored_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      mastery_confidence: {
        Row: {
          band: Database["public"]["Enums"]["confidence_band"]
          id: string
          mastery_estimate_id: string
          reason: string
        }
        Insert: {
          band: Database["public"]["Enums"]["confidence_band"]
          id?: string
          mastery_estimate_id: string
          reason: string
        }
        Update: {
          band?: Database["public"]["Enums"]["confidence_band"]
          id?: string
          mastery_estimate_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastery_confidence_mastery_estimate_id_fkey"
            columns: ["mastery_estimate_id"]
            isOneToOne: false
            referencedRelation: "mastery_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      mastery_estimates: {
        Row: {
          band: Database["public"]["Enums"]["readiness_band"]
          computed_at: string
          estimate: number
          id: string
          inputs: Json
          rule_version: string
          skill_profile_id: string
        }
        Insert: {
          band: Database["public"]["Enums"]["readiness_band"]
          computed_at?: string
          estimate: number
          id?: string
          inputs: Json
          rule_version: string
          skill_profile_id: string
        }
        Update: {
          band?: Database["public"]["Enums"]["readiness_band"]
          computed_at?: string
          estimate?: number
          id?: string
          inputs?: Json
          rule_version?: string
          skill_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastery_estimates_skill_profile_id_fkey"
            columns: ["skill_profile_id"]
            isOneToOne: false
            referencedRelation: "skill_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      roster_sections: {
        Row: {
          course_title: string
          course_version_id: string
          created_at: string
          cycle: number
          day_in_cycle: number
          id: string
          period: string
          site_id: string
          teacher_id: string
        }
        Insert: {
          course_title: string
          course_version_id: string
          created_at?: string
          cycle?: number
          day_in_cycle?: number
          id?: string
          period: string
          site_id: string
          teacher_id: string
        }
        Update: {
          course_title?: string
          course_version_id?: string
          created_at?: string
          cycle?: number
          day_in_cycle?: number
          id?: string
          period?: string
          site_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_sections_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_sections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_sections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
          short_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
          short_name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          short_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_profiles: {
        Row: {
          id: string
          skill: string
          standard: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          skill: string
          standard?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          skill?: string
          standard?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_messages: {
        Row: {
          body: string
          from_user_id: string
          id: string
          is_help_request: boolean
          resolved_at: string | null
          sent_at: string
          subject: string
          to_student_id: string
        }
        Insert: {
          body: string
          from_user_id: string
          id?: string
          is_help_request?: boolean
          resolved_at?: string | null
          sent_at?: string
          subject: string
          to_student_id: string
        }
        Update: {
          body?: string
          from_user_id?: string
          id?: string
          is_help_request?: boolean
          resolved_at?: string | null
          sent_at?: string
          subject?: string
          to_student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_messages_to_student_id_fkey"
            columns: ["to_student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          curriculum_author: boolean
          deactivated_at: string | null
          deactivated_reason: string | null
          first_name: string
          grade_level: number | null
          id: string
          last_name: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          site_id: string | null
        }
        Insert: {
          created_at?: string
          curriculum_author?: boolean
          deactivated_at?: string | null
          deactivated_reason?: string | null
          first_name: string
          grade_level?: number | null
          id: string
          last_name: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          site_id?: string | null
        }
        Update: {
          created_at?: string
          curriculum_author?: boolean
          deactivated_at?: string | null
          deactivated_reason?: string | null
          first_name?: string
          grade_level?: number | null
          id?: string
          last_name?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      evidence_current: {
        Row: {
          attempt: number | null
          correct: boolean | null
          course_version_id: string | null
          enrollment_id: string | null
          error_code: string | null
          hints_used: number | null
          id: string | null
          item_id: string | null
          lesson_code: string | null
          meaningful_minutes: number | null
          recorded_at: string | null
          recorded_by_user_id: string | null
          response: string | null
          skill: string | null
          source: Database["public"]["Enums"]["evidence_source"] | null
          stage: string | null
          standard: string | null
          student_id: string | null
          supersedes_evidence_id: string | null
          support_used: string | null
        }
        Insert: {
          attempt?: number | null
          correct?: boolean | null
          course_version_id?: string | null
          enrollment_id?: string | null
          error_code?: string | null
          hints_used?: number | null
          id?: string | null
          item_id?: string | null
          lesson_code?: string | null
          meaningful_minutes?: number | null
          recorded_at?: string | null
          recorded_by_user_id?: string | null
          response?: string | null
          skill?: string | null
          source?: Database["public"]["Enums"]["evidence_source"] | null
          stage?: string | null
          standard?: string | null
          student_id?: string | null
          supersedes_evidence_id?: string | null
          support_used?: string | null
        }
        Update: {
          attempt?: number | null
          correct?: boolean | null
          course_version_id?: string | null
          enrollment_id?: string | null
          error_code?: string | null
          hints_used?: number | null
          id?: string | null
          item_id?: string | null
          lesson_code?: string | null
          meaningful_minutes?: number | null
          recorded_at?: string | null
          recorded_by_user_id?: string | null
          response?: string | null
          skill?: string | null
          source?: Database["public"]["Enums"]["evidence_source"] | null
          stage?: string | null
          standard?: string | null
          student_id?: string | null
          supersedes_evidence_id?: string | null
          support_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_recorded_by_user_id_fkey"
            columns: ["recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_supersedes_evidence_id_fkey"
            columns: ["supersedes_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_supersedes_evidence_id_fkey"
            columns: ["supersedes_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_current"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_records_current: {
        Row: {
          assessment_id: string | null
          category_id: string | null
          enrollment_id: string | null
          entered_by_user_id: string | null
          id: string | null
          lesson_code: string | null
          points_earned: number | null
          points_possible: number | null
          reason: string | null
          recorded_at: string | null
          rule_version: string | null
          student_id: string | null
          supersedes_grade_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          category_id?: string | null
          enrollment_id?: string | null
          entered_by_user_id?: string | null
          id?: string | null
          lesson_code?: string | null
          points_earned?: number | null
          points_possible?: number | null
          reason?: string | null
          recorded_at?: string | null
          rule_version?: string | null
          student_id?: string | null
          supersedes_grade_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          category_id?: string | null
          enrollment_id?: string | null
          entered_by_user_id?: string | null
          id?: string | null
          lesson_code?: string | null
          points_earned?: number | null
          points_possible?: number | null
          reason?: string | null
          recorded_at?: string | null
          rule_version?: string | null
          student_id?: string | null
          supersedes_grade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "grade_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_entered_by_user_id_fkey"
            columns: ["entered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_supersedes_grade_id_fkey"
            columns: ["supersedes_grade_id"]
            isOneToOne: false
            referencedRelation: "grade_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_records_supersedes_grade_id_fkey"
            columns: ["supersedes_grade_id"]
            isOneToOne: false
            referencedRelation: "grade_records_current"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_assign_intervention: { Args: { target: string }; Returns: boolean }
      can_enter_grade: { Args: { target: string }; Returns: boolean }
      can_provision: {
        Args: {
          target_org: string
          target_role: Database["public"]["Enums"]["user_role"]
          target_site: string
        }
        Returns: boolean
      }
      can_read_student: { Args: { target: string }; Returns: boolean }
      current_org: { Args: never; Returns: string }
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_site: { Args: never; Returns: string }
      generate_claim_code: { Args: never; Returns: string }
      is_curriculum_author: { Args: never; Returns: boolean }
      issue_invitation: {
        Args: {
          p_curriculum_author: boolean
          p_email: string
          p_first_name: string
          p_grade_level: number
          p_idempotency_key: string
          p_last_name: string
          p_reason: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_site_id: string
        }
        Returns: string
      }
      lesson_is_editable: { Args: { lesson_id: string }; Returns: boolean }
      revoke_invitation: {
        Args: {
          p_idempotency_key: string
          p_invitation_id: string
          p_reason: string
        }
        Returns: string
      }
      set_profile_active: {
        Args: {
          p_active: boolean
          p_idempotency_key: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      storage_object_owner: { Args: { object_name: string }; Returns: string }
      structure_is_editable: {
        Args: { structure_id: string }
        Returns: boolean
      }
      students_in_scope: { Args: never; Returns: string[] }
      version_is_draft: { Args: { version_id: string }; Returns: boolean }
    }
    Enums: {
      callout_tone: "note" | "important" | "example" | "memory"
      confidence_band: "insufficient" | "low" | "moderate" | "high"
      curriculum_status:
        | "draft"
        | "in_review"
        | "approved"
        | "published"
        | "retired"
      enrollment_status:
        | "pending"
        | "active"
        | "transferred"
        | "withdrawn"
        | "archived"
      evidence_source:
        | "pathway_lesson"
        | "exit_ticket"
        | "spiral_review"
        | "intervention"
        | "readiness_check"
        | "transfer_check"
        | "teacher_observation"
        | "proctored"
      intervention_severity:
        | "immediate"
        | "targeted"
        | "spaced"
        | "teacher_review"
      intervention_status:
        | "recommended"
        | "teacher_reviewed"
        | "assigned"
        | "in_progress"
        | "readiness_check"
        | "passed"
        | "returned_to_pathway"
        | "escalated"
        | "closed"
      invitation_status: "pending" | "claimed" | "revoked"
      item_purpose:
        | "exit_ticket"
        | "spiral_review"
        | "readiness_check"
        | "transfer_check"
      lesson_block_kind:
        | "heading"
        | "text"
        | "callout"
        | "list"
        | "definition"
        | "table"
        | "image"
        | "video"
        | "material"
      lesson_material_kind:
        | "reading"
        | "worksheet"
        | "slides"
        | "dataset"
        | "reference"
        | "manipulative"
      lesson_status:
        | "locked"
        | "available"
        | "in_progress"
        | "submitted"
        | "passed"
        | "review_scheduled"
        | "completed"
      readiness_band:
        | "not_started"
        | "needs_support"
        | "developing"
        | "secure"
        | "strong"
      user_role:
        | "student"
        | "teacher"
        | "site_admin"
        | "org_admin"
        | "curriculum_author"
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
    Enums: {
      callout_tone: ["note", "important", "example", "memory"],
      confidence_band: ["insufficient", "low", "moderate", "high"],
      curriculum_status: [
        "draft",
        "in_review",
        "approved",
        "published",
        "retired",
      ],
      enrollment_status: [
        "pending",
        "active",
        "transferred",
        "withdrawn",
        "archived",
      ],
      evidence_source: [
        "pathway_lesson",
        "exit_ticket",
        "spiral_review",
        "intervention",
        "readiness_check",
        "transfer_check",
        "teacher_observation",
        "proctored",
      ],
      intervention_severity: [
        "immediate",
        "targeted",
        "spaced",
        "teacher_review",
      ],
      intervention_status: [
        "recommended",
        "teacher_reviewed",
        "assigned",
        "in_progress",
        "readiness_check",
        "passed",
        "returned_to_pathway",
        "escalated",
        "closed",
      ],
      invitation_status: ["pending", "claimed", "revoked"],
      item_purpose: [
        "exit_ticket",
        "spiral_review",
        "readiness_check",
        "transfer_check",
      ],
      lesson_block_kind: [
        "heading",
        "text",
        "callout",
        "list",
        "definition",
        "table",
        "image",
        "video",
        "material",
      ],
      lesson_material_kind: [
        "reading",
        "worksheet",
        "slides",
        "dataset",
        "reference",
        "manipulative",
      ],
      lesson_status: [
        "locked",
        "available",
        "in_progress",
        "submitted",
        "passed",
        "review_scheduled",
        "completed",
      ],
      readiness_band: [
        "not_started",
        "needs_support",
        "developing",
        "secure",
        "strong",
      ],
      user_role: [
        "student",
        "teacher",
        "site_admin",
        "org_admin",
        "curriculum_author",
      ],
    },
  },
} as const

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_batch_test_results: {
        Row: {
          combination_id: string | null
          combination_variables: Json
          created_at: string | null
          diagnostic_issues_passed: Json | null
          error_message: string | null
          execution_time_ms: number | null
          function_name: string
          id: string
          linked_simulation_id: string | null
          request_body: Json
          response_data: Json | null
          response_metrics: Json | null
          response_quality_score: number | null
          success: boolean
          test_batch_id: string
          test_type: string
        }
        Insert: {
          combination_id?: string | null
          combination_variables?: Json
          created_at?: string | null
          diagnostic_issues_passed?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          function_name: string
          id?: string
          linked_simulation_id?: string | null
          request_body?: Json
          response_data?: Json | null
          response_metrics?: Json | null
          response_quality_score?: number | null
          success?: boolean
          test_batch_id: string
          test_type: string
        }
        Update: {
          combination_id?: string | null
          combination_variables?: Json
          created_at?: string | null
          diagnostic_issues_passed?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string
          id?: string
          linked_simulation_id?: string | null
          request_body?: Json
          response_data?: Json | null
          response_metrics?: Json | null
          response_quality_score?: number | null
          success?: boolean
          test_batch_id?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_batch_test_results_linked_simulation_id_fkey"
            columns: ["linked_simulation_id"]
            isOneToOne: false
            referencedRelation: "ai_batch_test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inference_logs: {
        Row: {
          application_id: string | null
          confidence_factors: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          inference_type: string
          input_data_quality: Json | null
          measured_impact: Json | null
          model_version: string | null
          org_id: string
          processing_time_ms: number | null
          recommendations_count: number | null
          result_summary: Json | null
          scenario_type: string
          store_id: string
          user_id: string
          was_applied: boolean | null
        }
        Insert: {
          application_id?: string | null
          confidence_factors?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          inference_type: string
          input_data_quality?: Json | null
          measured_impact?: Json | null
          model_version?: string | null
          org_id: string
          processing_time_ms?: number | null
          recommendations_count?: number | null
          result_summary?: Json | null
          scenario_type: string
          store_id: string
          user_id: string
          was_applied?: boolean | null
        }
        Update: {
          application_id?: string | null
          confidence_factors?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          inference_type?: string
          input_data_quality?: Json | null
          measured_impact?: Json | null
          model_version?: string | null
          org_id?: string
          processing_time_ms?: number | null
          recommendations_count?: number | null
          result_summary?: Json | null
          scenario_type?: string
          store_id?: string
          user_id?: string
          was_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_inference_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inference_results: {
        Row: {
          created_at: string | null
          id: string
          inference_type: string
          model_used: string | null
          org_id: string | null
          parameters: Json | null
          processing_time_ms: number | null
          result: Json
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inference_type: string
          model_used?: string | null
          org_id?: string | null
          parameters?: Json | null
          processing_time_ms?: number | null
          result: Json
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inference_type?: string
          model_used?: string | null
          org_id?: string | null
          parameters?: Json | null
          processing_time_ms?: number | null
          result?: Json
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_inference_results_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          category: string | null
          created_at: string
          id: string
          insight_text: string
          kpi_refs: Json | null
          metadata: Json | null
          org_id: string | null
          severity: string | null
          source: string | null
          store_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          insight_text: string
          kpi_refs?: Json | null
          metadata?: Json | null
          org_id?: string | null
          severity?: string | null
          source?: string | null
          store_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          insight_text?: string
          kpi_refs?: Json | null
          metadata?: Json | null
          org_id?: string | null
          severity?: string | null
          source?: string | null
          store_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_performance: {
        Row: {
          applied_count: number | null
          avg_actual_roi: number | null
          avg_confidence: number | null
          avg_predicted_roi: number | null
          confidence_adjustment: number | null
          created_at: string | null
          failure_count: number | null
          id: string
          model_type: string
          org_id: string
          partial_count: number | null
          period_end: string
          period_start: string
          prediction_accuracy: number | null
          prompt_adjustments: Json | null
          roi_adjustment: number | null
          store_id: string | null
          success_count: number | null
          total_predictions: number | null
        }
        Insert: {
          applied_count?: number | null
          avg_actual_roi?: number | null
          avg_confidence?: number | null
          avg_predicted_roi?: number | null
          confidence_adjustment?: number | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          model_type: string
          org_id: string
          partial_count?: number | null
          period_end: string
          period_start: string
          prediction_accuracy?: number | null
          prompt_adjustments?: Json | null
          roi_adjustment?: number | null
          store_id?: string | null
          success_count?: number | null
          total_predictions?: number | null
        }
        Update: {
          applied_count?: number | null
          avg_actual_roi?: number | null
          avg_confidence?: number | null
          avg_predicted_roi?: number | null
          confidence_adjustment?: number | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          model_type?: string
          org_id?: string
          partial_count?: number | null
          period_end?: string
          period_start?: string
          prediction_accuracy?: number | null
          prompt_adjustments?: Json | null
          roi_adjustment?: number | null
          store_id?: string | null
          success_count?: number | null
          total_predictions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_performance_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_model_performance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          action_category: string | null
          created_at: string
          data_source: string | null
          description: string
          dismissed_at: string | null
          displayed_at: string | null
          evidence: Json | null
          expected_impact: Json | null
          id: string
          is_displayed: boolean | null
          org_id: string | null
          priority: string
          recommendation_type: string
          status: string | null
          store_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_category?: string | null
          created_at?: string
          data_source?: string | null
          description: string
          dismissed_at?: string | null
          displayed_at?: string | null
          evidence?: Json | null
          expected_impact?: Json | null
          id?: string
          is_displayed?: boolean | null
          org_id?: string | null
          priority: string
          recommendation_type: string
          status?: string | null
          store_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_category?: string | null
          created_at?: string
          data_source?: string | null
          description?: string
          dismissed_at?: string | null
          displayed_at?: string | null
          evidence?: Json | null
          expected_impact?: Json | null
          id?: string
          is_displayed?: boolean | null
          org_id?: string | null
          priority?: string
          recommendation_type?: string
          status?: string | null
          store_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_response_logs: {
        Row: {
          ai_response: Json
          completion_tokens: number | null
          context_metadata: Json | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          fallback_used: boolean | null
          function_name: string
          had_error: boolean | null
          id: string
          input_variables: Json
          is_good_example: boolean | null
          model_used: string | null
          parse_attempts: number | null
          parse_success: boolean | null
          prompt_tokens: number | null
          quality_notes: string | null
          quality_score: number | null
          raw_response_length: number | null
          response_summary: Json | null
          schema_validation_errors: Json | null
          simulation_type: string
          store_id: string
          updated_at: string | null
          used_fallback: boolean | null
          user_id: string | null
        }
        Insert: {
          ai_response?: Json
          completion_tokens?: number | null
          context_metadata?: Json | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          fallback_used?: boolean | null
          function_name: string
          had_error?: boolean | null
          id?: string
          input_variables?: Json
          is_good_example?: boolean | null
          model_used?: string | null
          parse_attempts?: number | null
          parse_success?: boolean | null
          prompt_tokens?: number | null
          quality_notes?: string | null
          quality_score?: number | null
          raw_response_length?: number | null
          response_summary?: Json | null
          schema_validation_errors?: Json | null
          simulation_type: string
          store_id: string
          updated_at?: string | null
          used_fallback?: boolean | null
          user_id?: string | null
        }
        Update: {
          ai_response?: Json
          completion_tokens?: number | null
          context_metadata?: Json | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          fallback_used?: boolean | null
          function_name?: string
          had_error?: boolean | null
          id?: string
          input_variables?: Json
          is_good_example?: boolean | null
          model_used?: string | null
          parse_attempts?: number | null
          parse_success?: boolean | null
          prompt_tokens?: number | null
          quality_notes?: string | null
          quality_score?: number | null
          raw_response_length?: number | null
          response_summary?: Json | null
          schema_validation_errors?: Json | null
          simulation_type?: string
          store_id?: string
          updated_at?: string | null
          used_fallback?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_response_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_scene_analysis: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          insights: Json
          org_id: string | null
          scene_data: Json
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          insights: Json
          org_id?: string | null
          scene_data: Json
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          insights?: Json
          org_id?: string | null
          scene_data?: Json
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_scene_analysis_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          org_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          org_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source?: string | null
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          org_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_history: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          input_data: Json
          org_id: string | null
          result: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          input_data: Json
          org_id?: string | null
          result: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          input_data?: Json
          org_id?: string | null
          result?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      api_connections: {
        Row: {
          api_body_template: Json | null
          auth_config: Json | null
          auth_type: string | null
          auth_value: string | null
          connection_category: string | null
          created_at: string
          data_category: string | null
          description: string | null
          display_order: number | null
          error_count: number | null
          field_mappings: Json | null
          headers: Json | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_credentials_encrypted: boolean | null
          is_system_managed: boolean | null
          last_error: string | null
          last_sync: string | null
          last_sync_duration_ms: number | null
          last_tested_at: string | null
          max_retries: number | null
          method: string | null
          name: string
          next_scheduled_sync: string | null
          next_sync_at: string | null
          org_id: string | null
          pagination_config: Json | null
          pagination_type: string | null
          provider: string | null
          rate_limit_config: Json | null
          request_config: Json | null
          response_data_path: string | null
          retry_count: number | null
          status: string | null
          store_id: string | null
          successful_syncs: number | null
          sync_config: Json | null
          sync_cron: string | null
          sync_frequency: string | null
          target_table: string | null
          total_records_synced: number | null
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          api_body_template?: Json | null
          auth_config?: Json | null
          auth_type?: string | null
          auth_value?: string | null
          connection_category?: string | null
          created_at?: string
          data_category?: string | null
          description?: string | null
          display_order?: number | null
          error_count?: number | null
          field_mappings?: Json | null
          headers?: Json | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_credentials_encrypted?: boolean | null
          is_system_managed?: boolean | null
          last_error?: string | null
          last_sync?: string | null
          last_sync_duration_ms?: number | null
          last_tested_at?: string | null
          max_retries?: number | null
          method?: string | null
          name: string
          next_scheduled_sync?: string | null
          next_sync_at?: string | null
          org_id?: string | null
          pagination_config?: Json | null
          pagination_type?: string | null
          provider?: string | null
          rate_limit_config?: Json | null
          request_config?: Json | null
          response_data_path?: string | null
          retry_count?: number | null
          status?: string | null
          store_id?: string | null
          successful_syncs?: number | null
          sync_config?: Json | null
          sync_cron?: string | null
          sync_frequency?: string | null
          target_table?: string | null
          total_records_synced?: number | null
          type: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          api_body_template?: Json | null
          auth_config?: Json | null
          auth_type?: string | null
          auth_value?: string | null
          connection_category?: string | null
          created_at?: string
          data_category?: string | null
          description?: string | null
          display_order?: number | null
          error_count?: number | null
          field_mappings?: Json | null
          headers?: Json | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_credentials_encrypted?: boolean | null
          is_system_managed?: boolean | null
          last_error?: string | null
          last_sync?: string | null
          last_sync_duration_ms?: number | null
          last_tested_at?: string | null
          max_retries?: number | null
          method?: string | null
          name?: string
          next_scheduled_sync?: string | null
          next_sync_at?: string | null
          org_id?: string | null
          pagination_config?: Json | null
          pagination_type?: string | null
          provider?: string | null
          rate_limit_config?: Json | null
          request_config?: Json | null
          response_data_path?: string | null
          retry_count?: number | null
          status?: string | null
          store_id?: string | null
          successful_syncs?: number | null
          sync_config?: Json | null
          sync_cron?: string | null
          sync_frequency?: string | null
          target_table?: string | null
          total_records_synced?: number | null
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      api_mapping_templates: {
        Row: {
          auth_config_hints: Json | null
          created_at: string | null
          data_category: string
          default_endpoint: string | null
          default_headers: Json | null
          default_method: string | null
          description: string | null
          field_mappings: Json
          id: string
          is_active: boolean | null
          is_official: boolean | null
          name: string
          pagination_config: Json | null
          pagination_type: string | null
          provider: string
          response_data_path: string | null
          suggested_auth_type: string | null
          target_table: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          auth_config_hints?: Json | null
          created_at?: string | null
          data_category: string
          default_endpoint?: string | null
          default_headers?: Json | null
          default_method?: string | null
          description?: string | null
          field_mappings: Json
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          name: string
          pagination_config?: Json | null
          pagination_type?: string | null
          provider: string
          response_data_path?: string | null
          suggested_auth_type?: string | null
          target_table: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          auth_config_hints?: Json | null
          created_at?: string | null
          data_category?: string
          default_endpoint?: string | null
          default_headers?: Json | null
          default_method?: string | null
          description?: string | null
          field_mappings?: Json
          id?: string
          is_active?: boolean | null
          is_official?: boolean | null
          name?: string
          pagination_config?: Json | null
          pagination_type?: string | null
          provider?: string
          response_data_path?: string | null
          suggested_auth_type?: string | null
          target_table?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      api_sync_logs: {
        Row: {
          api_connection_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          error_type: string | null
          etl_run_id: string | null
          fetch_completed_at: string | null
          id: string
          org_id: string | null
          processing_completed_at: string | null
          raw_import_id: string | null
          records_created: number | null
          records_failed: number | null
          records_fetched: number | null
          records_updated: number | null
          request_headers: Json | null
          request_url: string | null
          response_headers: Json | null
          response_size_bytes: number | null
          response_status: number | null
          started_at: string | null
          status: string
          sync_endpoint_id: string
          sync_type: string | null
        }
        Insert: {
          api_connection_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          error_type?: string | null
          etl_run_id?: string | null
          fetch_completed_at?: string | null
          id?: string
          org_id?: string | null
          processing_completed_at?: string | null
          raw_import_id?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          request_headers?: Json | null
          request_url?: string | null
          response_headers?: Json | null
          response_size_bytes?: number | null
          response_status?: number | null
          started_at?: string | null
          status: string
          sync_endpoint_id: string
          sync_type?: string | null
        }
        Update: {
          api_connection_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          error_type?: string | null
          etl_run_id?: string | null
          fetch_completed_at?: string | null
          id?: string
          org_id?: string | null
          processing_completed_at?: string | null
          raw_import_id?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          request_headers?: Json | null
          request_url?: string | null
          response_headers?: Json | null
          response_size_bytes?: number | null
          response_status?: number | null
          started_at?: string | null
          status?: string
          sync_endpoint_id?: string
          sync_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_sync_logs_api_connection_id_fkey"
            columns: ["api_connection_id"]
            isOneToOne: false
            referencedRelation: "api_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_sync_logs_etl_run_id_fkey"
            columns: ["etl_run_id"]
            isOneToOne: false
            referencedRelation: "etl_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_sync_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_sync_logs_raw_import_id_fkey"
            columns: ["raw_import_id"]
            isOneToOne: false
            referencedRelation: "raw_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_sync_logs_sync_endpoint_id_fkey"
            columns: ["sync_endpoint_id"]
            isOneToOne: false
            referencedRelation: "sync_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      applied_strategies: {
        Row: {
          actual_revenue: number | null
          baseline_metrics: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_roi: number | null
          description: string | null
          end_date: string
          expected_revenue: number | null
          expected_roi: number
          final_roi: number | null
          id: string
          name: string
          notes: string | null
          org_id: string
          result: string | null
          settings: Json | null
          source: string
          source_module: string
          start_date: string
          status: string | null
          store_id: string
          target_roi: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_revenue?: number | null
          baseline_metrics?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_roi?: number | null
          description?: string | null
          end_date: string
          expected_revenue?: number | null
          expected_roi: number
          final_roi?: number | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          result?: string | null
          settings?: Json | null
          source: string
          source_module: string
          start_date: string
          status?: string | null
          store_id: string
          target_roi?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_revenue?: number | null
          baseline_metrics?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_roi?: number | null
          description?: string | null
          end_date?: string
          expected_revenue?: number | null
          expected_roi?: number
          final_roi?: number | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          result?: string | null
          settings?: Json | null
          source?: string
          source_module?: string
          start_date?: string
          status?: string | null
          store_id?: string
          target_roi?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applied_strategies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applied_strategies_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_command_cache: {
        Row: {
          expires_at: string | null
          id: string
          input_hash: string | null
          input_pattern: string | null
          intent: string | null
          last_used_at: string | null
          parameters: Json | null
          store_id: string | null
          usage_count: number | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          input_hash?: string | null
          input_pattern?: string | null
          intent?: string | null
          last_used_at?: string | null
          parameters?: Json | null
          store_id?: string | null
          usage_count?: number | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          input_hash?: string | null
          input_pattern?: string | null
          intent?: string | null
          last_used_at?: string | null
          parameters?: Json | null
          store_id?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_command_cache_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_order_suggestions: {
        Row: {
          created_at: string | null
          current_stock: number
          estimated_stockout_date: string | null
          id: string
          optimal_stock: number
          org_id: string | null
          potential_revenue_loss: number | null
          product_id: string
          status: string
          suggested_order_quantity: number
          updated_at: string | null
          urgency_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_stock: number
          estimated_stockout_date?: string | null
          id?: string
          optimal_stock: number
          org_id?: string | null
          potential_revenue_loss?: number | null
          product_id: string
          status?: string
          suggested_order_quantity: number
          updated_at?: string | null
          urgency_level: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_stock?: number
          estimated_stockout_date?: string | null
          id?: string
          optimal_stock?: number
          org_id?: string | null
          potential_revenue_loss?: number | null
          product_id?: string
          status?: string
          suggested_order_quantity?: number
          updated_at?: string | null
          urgency_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_order_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      beacon_events: {
        Row: {
          beacon_id: string | null
          created_at: string
          device_id: string | null
          event_ts: string
          id: string
          metadata: Json | null
          org_id: string | null
          rssi: number | null
          store_id: string | null
        }
        Insert: {
          beacon_id?: string | null
          created_at?: string
          device_id?: string | null
          event_ts: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          rssi?: number | null
          store_id?: string | null
        }
        Update: {
          beacon_id?: string | null
          created_at?: string
          device_id?: string | null
          event_ts?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          rssi?: number | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beacon_events_beacon_id_fkey"
            columns: ["beacon_id"]
            isOneToOne: false
            referencedRelation: "beacons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beacon_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beacon_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      beacons: {
        Row: {
          beacon_code: string
          created_at: string
          id: string
          location: string | null
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          beacon_code: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          beacon_code?: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beacons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beacons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_events: {
        Row: {
          camera_code: string | null
          count: number | null
          created_at: string
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          camera_code?: string | null
          count?: number | null
          created_at?: string
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          camera_code?: string | null
          count?: number | null
          created_at?: string
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_context_memory: {
        Row: {
          conversation_id: string
          conversation_insights: Json | null
          conversation_summary: string | null
          created_at: string | null
          id: string
          last_turn_count: number | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
          user_profile: Json | null
        }
        Insert: {
          conversation_id: string
          conversation_insights?: Json | null
          conversation_summary?: string | null
          created_at?: string | null
          id?: string
          last_turn_count?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_profile?: Json | null
        }
        Update: {
          conversation_id?: string
          conversation_insights?: Json | null
          conversation_summary?: string | null
          created_at?: string | null
          id?: string
          last_turn_count?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_profile?: Json | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          channel: Database["public"]["Enums"]["chat_channel"]
          channel_metadata: Json | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          message_count: number | null
          satisfaction_rating: number | null
          session_id: string | null
          store_id: string | null
          title: string | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["chat_channel"]
          channel_metadata?: Json | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_count?: number | null
          satisfaction_rating?: number | null
          session_id?: string | null
          store_id?: string | null
          title?: string | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["chat_channel"]
          channel_metadata?: Json | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_count?: number | null
          satisfaction_rating?: number | null
          session_id?: string | null
          store_id?: string | null
          title?: string | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_daily_analytics: {
        Row: {
          avg_turns_per_session: number | null
          channel: Database["public"]["Enums"]["chat_channel"]
          date: string
          id: string
          lead_conversion_rate: number | null
          satisfaction_avg: number | null
          top_intents: Json | null
          top_pain_points: Json | null
          top_topics: Json | null
          total_sessions: number | null
          unique_users: number | null
        }
        Insert: {
          avg_turns_per_session?: number | null
          channel: Database["public"]["Enums"]["chat_channel"]
          date: string
          id?: string
          lead_conversion_rate?: number | null
          satisfaction_avg?: number | null
          top_intents?: Json | null
          top_pain_points?: Json | null
          top_topics?: Json | null
          total_sessions?: number | null
          unique_users?: number | null
        }
        Update: {
          avg_turns_per_session?: number | null
          channel?: Database["public"]["Enums"]["chat_channel"]
          date?: string
          id?: string
          lead_conversion_rate?: number | null
          satisfaction_avg?: number | null
          top_intents?: Json | null
          top_pain_points?: Json | null
          top_topics?: Json | null
          total_sessions?: number | null
          unique_users?: number | null
        }
        Relationships: []
      }
      chat_events: {
        Row: {
          channel: Database["public"]["Enums"]["chat_channel"]
          conversation_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["chat_channel"]
          conversation_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["chat_channel"]
          conversation_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_leads: {
        Row: {
          company: string | null
          conversation_id: string | null
          created_at: string | null
          email: string
          id: string
          pain_points: Json | null
          role: string | null
          source_page: string | null
        }
        Insert: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          pain_points?: Json | null
          role?: string | null
          source_page?: string | null
        }
        Update: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          pain_points?: Json | null
          role?: string | null
          source_page?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_data: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          execution_time_ms: number | null
          feedback_comment: string | null
          id: string
          model_used: string | null
          role: string
          tokens_used: number | null
          user_feedback: string | null
        }
        Insert: {
          channel_data?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          execution_time_ms?: number | null
          feedback_comment?: string | null
          id?: string
          model_used?: string | null
          role: string
          tokens_used?: number | null
          user_feedback?: string | null
        }
        Update: {
          channel_data?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          execution_time_ms?: number | null
          feedback_comment?: string | null
          id?: string
          model_used?: string | null
          role?: string
          tokens_used?: number | null
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      column_mappings: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          source_column: string
          table_id: string
          target_column: string
          target_entity: string
          transformation_rule: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          source_column: string
          table_id: string
          target_column: string
          target_entity: string
          transformation_rule?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          source_column?: string
          table_id?: string
          target_column?: string
          target_entity?: string
          transformation_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "column_mappings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string
          created_at: string
          email: string
          features: string[] | null
          id: string
          marketing_consent: boolean | null
          message: string | null
          name: string
          phone: string | null
          privacy_consent: boolean
          stores: number | null
          timeline: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          features?: string[] | null
          id?: string
          marketing_consent?: boolean | null
          message?: string | null
          name: string
          phone?: string | null
          privacy_consent?: boolean
          stores?: number | null
          timeline?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          features?: string[] | null
          id?: string
          marketing_consent?: boolean | null
          message?: string | null
          name?: string
          phone?: string | null
          privacy_consent?: boolean
          stores?: number | null
          timeline?: string | null
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          avg_ltv: number | null
          avg_purchase_frequency: number | null
          created_at: string | null
          criteria: Json | null
          customer_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          segment_code: string
          segment_name: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          avg_ltv?: number | null
          avg_purchase_frequency?: number | null
          created_at?: string | null
          criteria?: Json | null
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          segment_code: string
          segment_name: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avg_ltv?: number | null
          avg_purchase_frequency?: number | null
          created_at?: string | null
          criteria?: Json | null
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          segment_code?: string
          segment_name?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments_agg: {
        Row: {
          avg_basket_size: number | null
          avg_transaction_value: number | null
          calculated_at: string | null
          churn_risk_score: number | null
          created_at: string | null
          customer_count: number | null
          date: string
          id: string
          ltv_estimate: number | null
          metadata: Json | null
          org_id: string | null
          segment_name: string
          segment_type: string
          store_id: string | null
          total_revenue: number | null
          visit_frequency: number | null
        }
        Insert: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          calculated_at?: string | null
          churn_risk_score?: number | null
          created_at?: string | null
          customer_count?: number | null
          date: string
          id?: string
          ltv_estimate?: number | null
          metadata?: Json | null
          org_id?: string | null
          segment_name: string
          segment_type: string
          store_id?: string | null
          total_revenue?: number | null
          visit_frequency?: number | null
        }
        Update: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          calculated_at?: string | null
          churn_risk_score?: number | null
          created_at?: string | null
          customer_count?: number | null
          date?: string
          id?: string
          ltv_estimate?: number | null
          metadata?: Json | null
          org_id?: string | null
          segment_name?: string
          segment_type?: string
          store_id?: string | null
          total_revenue?: number | null
          visit_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_agg_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_agg_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_type: string | null
          avatar_url: string | null
          created_at: string
          customer_name: string | null
          email: string | null
          id: string
          last_visit_date: string | null
          org_id: string | null
          phone: string | null
          segment: string | null
          store_id: string | null
          total_purchases: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_type?: string | null
          avatar_url?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          last_visit_date?: string | null
          org_id?: string | null
          phone?: string | null
          segment?: string | null
          store_id?: string | null
          total_purchases?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_type?: string | null
          avatar_url?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          last_visit_date?: string | null
          org_id?: string | null
          phone?: string | null
          segment?: string | null
          store_id?: string | null
          total_purchases?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_kpis_agg: {
        Row: {
          avg_basket_size: number | null
          avg_transaction_value: number | null
          avg_visit_duration_seconds: number | null
          browse_to_engage_rate: number | null
          calculated_at: string | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          engage_to_purchase_rate: number | null
          id: string
          is_holiday: boolean | null
          labor_hours: number | null
          metadata: Json | null
          org_id: string | null
          returning_visitors: number | null
          sales_per_labor_hour: number | null
          sales_per_sqm: number | null
          sales_per_visitor: number | null
          source_trace: Json | null
          special_event: string | null
          store_id: string | null
          temperature: number | null
          total_revenue: number | null
          total_transactions: number | null
          total_units_sold: number | null
          total_visitors: number | null
          unique_visitors: number | null
          updated_at: string | null
          weather_condition: string | null
        }
        Insert: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          avg_visit_duration_seconds?: number | null
          browse_to_engage_rate?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          engage_to_purchase_rate?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          metadata?: Json | null
          org_id?: string | null
          returning_visitors?: number | null
          sales_per_labor_hour?: number | null
          sales_per_sqm?: number | null
          sales_per_visitor?: number | null
          source_trace?: Json | null
          special_event?: string | null
          store_id?: string | null
          temperature?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
          total_units_sold?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          weather_condition?: string | null
        }
        Update: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          avg_visit_duration_seconds?: number | null
          browse_to_engage_rate?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          engage_to_purchase_rate?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          metadata?: Json | null
          org_id?: string | null
          returning_visitors?: number | null
          sales_per_labor_hour?: number | null
          sales_per_sqm?: number | null
          sales_per_visitor?: number | null
          source_trace?: Json | null
          special_event?: string | null
          store_id?: string | null
          temperature?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
          total_units_sold?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_kpis_agg_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_kpis_agg_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales: {
        Row: {
          avg_transaction_value: number | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          total_customers: number | null
          total_revenue: number | null
          total_transactions: number | null
        }
        Insert: {
          avg_transaction_value?: number | null
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          total_customers?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Update: {
          avg_transaction_value?: number | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          total_customers?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_kpis: {
        Row: {
          consumer_sentiment_index: number | null
          conversion_rate: number | null
          created_at: string
          date: string
          funnel_browse: number | null
          funnel_entry: number | null
          funnel_fitting: number | null
          funnel_purchase: number | null
          funnel_return: number | null
          id: string
          is_holiday: boolean | null
          labor_hours: number | null
          org_id: string | null
          sales_per_sqm: number | null
          special_event: string | null
          store_id: string | null
          total_purchases: number | null
          total_revenue: number | null
          total_visits: number | null
          updated_at: string
          user_id: string
          weather_condition: string | null
        }
        Insert: {
          consumer_sentiment_index?: number | null
          conversion_rate?: number | null
          created_at?: string
          date: string
          funnel_browse?: number | null
          funnel_entry?: number | null
          funnel_fitting?: number | null
          funnel_purchase?: number | null
          funnel_return?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          org_id?: string | null
          sales_per_sqm?: number | null
          special_event?: string | null
          store_id?: string | null
          total_purchases?: number | null
          total_revenue?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id: string
          weather_condition?: string | null
        }
        Update: {
          consumer_sentiment_index?: number | null
          conversion_rate?: number | null
          created_at?: string
          date?: string
          funnel_browse?: number | null
          funnel_entry?: number | null
          funnel_fitting?: number | null
          funnel_purchase?: number | null
          funnel_return?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          org_id?: string | null
          sales_per_sqm?: number | null
          special_event?: string | null
          store_id?: string | null
          total_purchases?: number | null
          total_revenue?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_kpis_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_kpis_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_kpis_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_sync_logs: {
        Row: {
          completed_at: string | null
          data_source_id: string
          entities_created: number | null
          entities_updated: number | null
          errors: Json | null
          id: string
          relations_created: number | null
          started_at: string | null
          status: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          data_source_id: string
          entities_created?: number | null
          entities_updated?: number | null
          errors?: Json | null
          id?: string
          relations_created?: number | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          data_source_id?: string
          entities_created?: number | null
          entities_updated?: number | null
          errors?: Json | null
          id?: string
          relations_created?: number | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_source_sync_logs_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_tables: {
        Row: {
          columns: Json
          created_at: string | null
          data_source_id: string
          display_name: string | null
          id: string
          row_count: number | null
          sample_data: Json | null
          table_name: string
        }
        Insert: {
          columns?: Json
          created_at?: string | null
          data_source_id: string
          display_name?: string | null
          id?: string
          row_count?: number | null
          sample_data?: Json | null
          table_name: string
        }
        Update: {
          columns?: Json
          created_at?: string | null
          data_source_id?: string
          display_name?: string | null
          id?: string
          row_count?: number | null
          sample_data?: Json | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_source_tables_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          config: Json | null
          connection_string: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          last_sync_status: string | null
          org_id: string | null
          record_count: number | null
          schema_definition: Json | null
          source_id_code: string | null
          source_name: string
          source_type: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connection_string?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          org_id?: string | null
          record_count?: number | null
          schema_definition?: Json | null
          source_id_code?: string | null
          source_name: string
          source_type: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connection_string?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          org_id?: string | null
          record_count?: number | null
          schema_definition?: Json | null
          source_id_code?: string | null
          source_name?: string
          source_type?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sources_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          records_synced: number | null
          schedule_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          records_synced?: number | null
          schedule_id: string
          started_at?: string
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          records_synced?: number | null
          schedule_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sync_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "data_sync_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sync_schedules: {
        Row: {
          created_at: string
          cron_expression: string
          data_source_id: string
          error_message: string | null
          id: string
          is_enabled: boolean
          last_run_at: string | null
          last_status: string | null
          next_run_at: string | null
          org_id: string | null
          schedule_name: string
          sync_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          data_source_id: string
          error_message?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          org_id?: string | null
          schedule_name: string
          sync_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          data_source_id?: string
          error_message?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          org_id?: string | null
          schedule_name?: string
          sync_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sync_schedules_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_indicators: {
        Row: {
          created_at: string | null
          date: string
          id: string
          indicator_type: string
          indicator_value: number
          is_global: boolean
          metadata: Json | null
          org_id: string | null
          region: string | null
          source: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          indicator_type: string
          indicator_value: number
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          region?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          indicator_type?: string
          indicator_value?: number
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          region?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      etl_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          etl_function: string
          etl_version: string | null
          id: string
          input_record_count: number | null
          metadata: Json | null
          org_id: string | null
          output_record_count: number | null
          raw_import_ids: string[] | null
          started_at: string | null
          status: string | null
          store_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          etl_function: string
          etl_version?: string | null
          id?: string
          input_record_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          output_record_count?: number | null
          raw_import_ids?: string[] | null
          started_at?: string | null
          status?: string | null
          store_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          etl_function?: string
          etl_version?: string | null
          id?: string
          input_record_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          output_record_count?: number | null
          raw_import_ids?: string[] | null
          started_at?: string | null
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etl_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etl_runs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      external_data_sources: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          org_id: string | null
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          org_id?: string | null
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          org_id?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_reason_codes: {
        Row: {
          category: string
          code: string
          description: string | null
          display_order: number | null
          is_active: boolean | null
          label_en: string
          label_ko: string
        }
        Insert: {
          category: string
          code: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          label_en: string
          label_ko: string
        }
        Update: {
          category?: string
          code?: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          label_en?: string
          label_ko?: string
        }
        Relationships: []
      }
      field_transform_rules: {
        Row: {
          created_at: string | null
          default_value: string | null
          id: string
          is_active: boolean | null
          on_error: string | null
          priority: number | null
          source_field: string
          sync_endpoint_id: string
          target_field: string
          transform_config: Json | null
          transform_type: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          is_active?: boolean | null
          on_error?: string | null
          priority?: number | null
          source_field: string
          sync_endpoint_id: string
          target_field: string
          transform_config?: Json | null
          transform_type?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          is_active?: boolean | null
          on_error?: string | null
          priority?: number | null
          source_field?: string
          sync_endpoint_id?: string
          target_field?: string
          transform_config?: Json | null
          transform_type?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "field_transform_rules_sync_endpoint_id_fkey"
            columns: ["sync_endpoint_id"]
            isOneToOne: false
            referencedRelation: "sync_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          device_type: string | null
          duration_seconds: number | null
          event_date: string
          event_hour: number | null
          event_timestamp: string
          event_type: string
          id: string
          metadata: Json | null
          next_event_type: string | null
          org_id: string | null
          previous_event_type: string | null
          product_id: string | null
          session_id: string | null
          store_id: string | null
          visitor_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_date: string
          event_hour?: number | null
          event_timestamp: string
          event_type: string
          id?: string
          metadata?: Json | null
          next_event_type?: string | null
          org_id?: string | null
          previous_event_type?: string | null
          product_id?: string | null
          session_id?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_date?: string
          event_hour?: number | null
          event_timestamp?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          next_event_type?: string | null
          org_id?: string | null
          previous_event_type?: string | null
          product_id?: string | null
          session_id?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_metrics: {
        Row: {
          count: number
          created_at: string
          customer_segment: string | null
          date: string
          duration_seconds: number | null
          hour: number | null
          id: string
          org_id: string | null
          stage: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          count: number
          created_at?: string
          customer_segment?: string | null
          date: string
          duration_seconds?: number | null
          hour?: number | null
          id?: string
          org_id?: string | null
          stage: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          customer_segment?: string | null
          date?: string
          duration_seconds?: number | null
          hour?: number | null
          id?: string
          org_id?: string | null
          stage?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      furniture: {
        Row: {
          category: string | null
          created_at: string | null
          depth: number | null
          facing: string | null
          furniture_code: string | null
          furniture_name: string | null
          furniture_type: string
          height: number | null
          height_zone: string | null
          id: string
          is_active: boolean | null
          model_type: string | null
          model_url: string | null
          movable: boolean | null
          name: string
          org_id: string | null
          position_x: number | null
          position_y: number | null
          position_z: number | null
          properties: Json | null
          rotation_x: number | null
          rotation_y: number | null
          rotation_z: number | null
          scale_x: number | null
          scale_y: number | null
          scale_z: number | null
          store_id: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
          vmd_properties: Json | null
          width: number | null
          zone_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          depth?: number | null
          facing?: string | null
          furniture_code?: string | null
          furniture_name?: string | null
          furniture_type: string
          height?: number | null
          height_zone?: string | null
          id?: string
          is_active?: boolean | null
          model_type?: string | null
          model_url?: string | null
          movable?: boolean | null
          name: string
          org_id?: string | null
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          properties?: Json | null
          rotation_x?: number | null
          rotation_y?: number | null
          rotation_z?: number | null
          scale_x?: number | null
          scale_y?: number | null
          scale_z?: number | null
          store_id: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          vmd_properties?: Json | null
          width?: number | null
          zone_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          depth?: number | null
          facing?: string | null
          furniture_code?: string | null
          furniture_name?: string | null
          furniture_type?: string
          height?: number | null
          height_zone?: string | null
          id?: string
          is_active?: boolean | null
          model_type?: string | null
          model_url?: string | null
          movable?: boolean | null
          name?: string
          org_id?: string | null
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          properties?: Json | null
          rotation_x?: number | null
          rotation_y?: number | null
          rotation_z?: number | null
          scale_x?: number | null
          scale_y?: number | null
          scale_z?: number | null
          store_id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          vmd_properties?: Json | null
          width?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "furniture_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      furniture_facings: {
        Row: {
          code: string
          description: string | null
          name: string
          traffic_exposure: number
        }
        Insert: {
          code: string
          description?: string | null
          name: string
          traffic_exposure: number
        }
        Update: {
          code?: string
          description?: string | null
          name?: string
          traffic_exposure?: number
        }
        Relationships: []
      }
      furniture_height_zones: {
        Row: {
          accessibility_multiplier: number
          code: string
          description: string | null
          height_range_cm: string
          name: string
          recommended_products: string | null
          visibility_multiplier: number
        }
        Insert: {
          accessibility_multiplier: number
          code: string
          description?: string | null
          height_range_cm: string
          name: string
          recommended_products?: string | null
          visibility_multiplier: number
        }
        Update: {
          accessibility_multiplier?: number
          code?: string
          description?: string | null
          height_range_cm?: string
          name?: string
          recommended_products?: string | null
          visibility_multiplier?: number
        }
        Relationships: []
      }
      furniture_slots: {
        Row: {
          compatible_display_types: string[] | null
          created_at: string | null
          facing_count: number | null
          furniture_id: string
          furniture_type: string
          height_zone: string | null
          id: string
          is_occupied: boolean | null
          max_product_depth: number | null
          max_product_height: number | null
          max_product_width: number | null
          org_id: string | null
          properties: Json | null
          slot_height_cm: number | null
          slot_id: string
          slot_position: Json | null
          slot_rotation: Json | null
          slot_type: string
          store_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          compatible_display_types?: string[] | null
          created_at?: string | null
          facing_count?: number | null
          furniture_id: string
          furniture_type: string
          height_zone?: string | null
          id?: string
          is_occupied?: boolean | null
          max_product_depth?: number | null
          max_product_height?: number | null
          max_product_width?: number | null
          org_id?: string | null
          properties?: Json | null
          slot_height_cm?: number | null
          slot_id: string
          slot_position?: Json | null
          slot_rotation?: Json | null
          slot_type: string
          store_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          compatible_display_types?: string[] | null
          created_at?: string | null
          facing_count?: number | null
          furniture_id?: string
          furniture_type?: string
          height_zone?: string | null
          id?: string
          is_occupied?: boolean | null
          max_product_depth?: number | null
          max_product_height?: number | null
          max_product_width?: number | null
          org_id?: string | null
          properties?: Json | null
          slot_height_cm?: number | null
          slot_id?: string
          slot_position?: Json | null
          slot_rotation?: Json | null
          slot_type?: string
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_furniture_slots_furniture"
            columns: ["furniture_id"]
            isOneToOne: false
            referencedRelation: "furniture"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_furniture_slots_furniture"
            columns: ["furniture_id"]
            isOneToOne: false
            referencedRelation: "v_furniture_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_furniture_slots_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_entities: {
        Row: {
          created_at: string | null
          entity_code: string | null
          entity_type_id: string
          id: string
          is_active: boolean | null
          label: string
          model_3d_position: Json | null
          model_3d_rotation: Json | null
          model_3d_scale: Json | null
          org_id: string | null
          properties: Json | null
          store_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_code?: string | null
          entity_type_id: string
          id?: string
          is_active?: boolean | null
          label: string
          model_3d_position?: Json | null
          model_3d_rotation?: Json | null
          model_3d_scale?: Json | null
          org_id?: string | null
          properties?: Json | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_code?: string | null
          entity_type_id?: string
          id?: string
          is_active?: boolean | null
          label?: string
          model_3d_position?: Json | null
          model_3d_rotation?: Json | null
          model_3d_scale?: Json | null
          org_id?: string | null
          properties?: Json | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_entities_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_entities_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_relations: {
        Row: {
          created_at: string | null
          id: string
          org_id: string | null
          properties: Json | null
          relation_type_id: string
          source_entity_id: string
          store_id: string | null
          target_entity_id: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          properties?: Json | null
          relation_type_id: string
          source_entity_id: string
          store_id?: string | null
          target_entity_id: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          properties?: Json | null
          relation_type_id?: string
          source_entity_id?: string
          store_id?: string | null
          target_entity_id?: string
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_relations_relation_type_id_fkey"
            columns: ["relation_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_relation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays_events: {
        Row: {
          country_code: string | null
          created_at: string | null
          date: string
          description: string | null
          event_name: string
          event_type: string
          id: string
          impact_level: string | null
          is_global: boolean
          metadata: Json | null
          org_id: string | null
          raw_payload: Json | null
          region_code: string | null
          source_provider: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          event_name: string
          event_type: string
          id?: string
          impact_level?: string | null
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          region_code?: string | null
          source_provider?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          event_name?: string
          event_type?: string
          id?: string
          impact_level?: string | null
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          region_code?: string | null
          source_provider?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holidays_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_metrics: {
        Row: {
          avg_occupancy: number | null
          calculated_at: string | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          entry_count: number | null
          exit_count: number | null
          hour: number
          id: string
          metadata: Json | null
          org_id: string | null
          peak_occupancy: number | null
          revenue: number | null
          store_id: string | null
          transaction_count: number | null
          units_sold: number | null
          visitor_count: number | null
        }
        Insert: {
          avg_occupancy?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          entry_count?: number | null
          exit_count?: number | null
          hour: number
          id?: string
          metadata?: Json | null
          org_id?: string | null
          peak_occupancy?: number | null
          revenue?: number | null
          store_id?: string | null
          transaction_count?: number | null
          units_sold?: number | null
          visitor_count?: number | null
        }
        Update: {
          avg_occupancy?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          entry_count?: number | null
          exit_count?: number | null
          hour?: number
          id?: string
          metadata?: Json | null
          org_id?: string | null
          peak_occupancy?: number | null
          revenue?: number | null
          store_id?: string | null
          transaction_count?: number | null
          units_sold?: number | null
          visitor_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hourly_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_guidelines: {
        Row: {
          attachments: Json | null
          category: string
          content: string
          created_at: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          org_id: string
          priority: string | null
          target_stores: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          category: string
          content: string
          created_at?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          priority?: string | null
          target_stores?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          category?: string
          content?: string
          created_at?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          priority?: string | null
          target_stores?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hq_guidelines_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          org_id: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          org_id: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          org_id?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hq_notifications_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_store_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string
          org_id: string
          priority: string | null
          read_at: string | null
          recipient_role: Database["public"]["Enums"]["app_role"] | null
          recipient_store_id: string | null
          sender_name: string
          sender_role: Database["public"]["Enums"]["app_role"]
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          org_id: string
          priority?: string | null
          read_at?: string | null
          recipient_role?: Database["public"]["Enums"]["app_role"] | null
          recipient_store_id?: string | null
          sender_name: string
          sender_role: Database["public"]["Enums"]["app_role"]
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          org_id?: string
          priority?: string | null
          read_at?: string | null
          recipient_role?: Database["public"]["Enums"]["app_role"] | null
          recipient_store_id?: string | null
          sender_name?: string
          sender_role?: Database["public"]["Enums"]["app_role"]
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hq_messages_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hq_messages_recipient_store_new"
            columns: ["recipient_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hq_store_messages_recipient_store_id_fkey"
            columns: ["recipient_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      import_type_schemas: {
        Row: {
          created_at: string | null
          id: string
          import_type: string
          optional_fields: Json | null
          required_fields: Json
          sample_data: Json | null
          target_table: string
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_type: string
          optional_fields?: Json | null
          required_fields: Json
          sample_data?: Json | null
          target_table: string
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          import_type?: string
          optional_fields?: Json | null
          required_fields?: Json
          sample_data?: Json | null
          target_table?: string
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          metadata: Json | null
          org_id: string | null
          product_id: string | null
          quantity_on_hand: number
          reorder_point: number | null
          safety_stock: number | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          quantity_on_hand: number
          reorder_point?: number | null
          safety_stock?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          quantity_on_hand?: number
          reorder_point?: number | null
          safety_stock?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          adjustment_qty: number | null
          closing_qty: number | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          opening_qty: number | null
          org_id: string | null
          product_id: string | null
          received_qty: number | null
          sold_qty: number | null
          store_id: string | null
        }
        Insert: {
          adjustment_qty?: number | null
          closing_qty?: number | null
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          opening_qty?: number | null
          org_id?: string | null
          product_id?: string | null
          received_qty?: number | null
          sold_qty?: number | null
          store_id?: string | null
        }
        Update: {
          adjustment_qty?: number | null
          closing_qty?: number | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          opening_qty?: number | null
          org_id?: string | null
          product_id?: string | null
          received_qty?: number | null
          sold_qty?: number | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_levels: {
        Row: {
          created_at: string | null
          current_stock: number
          id: string
          last_updated: string | null
          minimum_stock: number
          optimal_stock: number
          org_id: string | null
          product_id: string
          user_id: string
          weekly_demand: number
        }
        Insert: {
          created_at?: string | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          minimum_stock: number
          optimal_stock: number
          org_id?: string | null
          product_id: string
          user_id: string
          weekly_demand?: number
        }
        Update: {
          created_at?: string | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          minimum_stock?: number
          optimal_stock?: number
          org_id?: string | null
          product_id?: string
          user_id?: string
          weekly_demand?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          moved_at: string
          movement_type: string
          new_stock: number | null
          org_id: string | null
          previous_stock: number | null
          product_id: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moved_at?: string
          movement_type: string
          new_stock?: number | null
          org_id?: string | null
          previous_stock?: number | null
          product_id?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moved_at?: string
          movement_type?: string
          new_stock?: number | null
          org_id?: string | null
          previous_stock?: number | null
          product_id?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          license_id: string | null
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          license_id?: string | null
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          license_id?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          additional_metrics: Json | null
          application_id: string | null
          avg_dwell_time_minutes: number | null
          avg_transaction_value: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          items_per_transaction: number | null
          org_id: string
          snapshot_date: string
          snapshot_type: string | null
          store_id: string
          total_revenue: number | null
          total_transactions: number | null
          total_visitors: number | null
        }
        Insert: {
          additional_metrics?: Json | null
          application_id?: string | null
          avg_dwell_time_minutes?: number | null
          avg_transaction_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          items_per_transaction?: number | null
          org_id: string
          snapshot_date: string
          snapshot_type?: string | null
          store_id: string
          total_revenue?: number | null
          total_transactions?: number | null
          total_visitors?: number | null
        }
        Update: {
          additional_metrics?: Json | null
          application_id?: string | null
          avg_dwell_time_minutes?: number | null
          avg_transaction_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          items_per_transaction?: number | null
          org_id?: string
          snapshot_date?: string
          snapshot_type?: string | null
          store_id?: string
          total_revenue?: number | null
          total_transactions?: number | null
          total_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recommendation_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          aggregation: string | null
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          org_id: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          aggregation?: string | null
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          org_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          aggregation?: string | null
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          org_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_optimization_results: {
        Row: {
          applied_at: string | null
          applied_changes: Json | null
          created_at: string | null
          expected_conversion_improvement: number | null
          expected_revenue_improvement: number | null
          expected_traffic_improvement: number | null
          feedback_action: string | null
          feedback_note: string | null
          feedback_reason: string | null
          furniture_changes: Json | null
          id: string
          optimization_type: string
          org_id: string | null
          parameters: Json | null
          product_changes: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          store_id: string
          summary: Json | null
          total_furniture_changes: number | null
          total_product_changes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_changes?: Json | null
          created_at?: string | null
          expected_conversion_improvement?: number | null
          expected_revenue_improvement?: number | null
          expected_traffic_improvement?: number | null
          feedback_action?: string | null
          feedback_note?: string | null
          feedback_reason?: string | null
          furniture_changes?: Json | null
          id?: string
          optimization_type: string
          org_id?: string | null
          parameters?: Json | null
          product_changes?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_id: string
          summary?: Json | null
          total_furniture_changes?: number | null
          total_product_changes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_changes?: Json | null
          created_at?: string | null
          expected_conversion_improvement?: number | null
          expected_revenue_improvement?: number | null
          expected_traffic_improvement?: number | null
          feedback_action?: string | null
          feedback_note?: string | null
          feedback_reason?: string | null
          furniture_changes?: Json | null
          id?: string
          optimization_type?: string
          org_id?: string | null
          parameters?: Json | null
          product_changes?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_id?: string
          summary?: Json | null
          total_furniture_changes?: number | null
          total_product_changes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "layout_optimization_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_optimization_results_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_adjustments: {
        Row: {
          adjustment_type: string
          applied_at: string | null
          applied_by: string | null
          created_at: string | null
          effectiveness_measured: boolean | null
          effectiveness_score: number | null
          id: string
          model_type: string
          new_value: Json | null
          org_id: string
          previous_value: Json | null
          store_id: string | null
          supporting_data: Json | null
          trigger_reason: string | null
        }
        Insert: {
          adjustment_type: string
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string | null
          effectiveness_measured?: boolean | null
          effectiveness_score?: number | null
          id?: string
          model_type: string
          new_value?: Json | null
          org_id: string
          previous_value?: Json | null
          store_id?: string | null
          supporting_data?: Json | null
          trigger_reason?: string | null
        }
        Update: {
          adjustment_type?: string
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string | null
          effectiveness_measured?: boolean | null
          effectiveness_score?: number | null
          id?: string
          model_type?: string
          new_value?: Json | null
          org_id?: string
          previous_value?: Json | null
          store_id?: string | null
          supporting_data?: Json | null
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_adjustments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_adjustments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          adjustments_applied: number | null
          adjustments_proposed: number | null
          completed_at: string | null
          error_message: string | null
          id: string
          improvement_metrics: Json | null
          predictions_evaluated: number | null
          started_at: string | null
          status: string
          store_id: string
        }
        Insert: {
          adjustments_applied?: number | null
          adjustments_proposed?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          improvement_metrics?: Json | null
          predictions_evaluated?: number | null
          started_at?: string | null
          status?: string
          store_id: string
        }
        Update: {
          adjustments_applied?: number | null
          adjustments_proposed?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          improvement_metrics?: Json | null
          predictions_evaluated?: number | null
          started_at?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      license_billing_history: {
        Row: {
          amount: number
          billing_date: string
          created_at: string
          id: string
          license_id: string
          notes: string | null
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_date: string
          created_at?: string
          id?: string
          license_id: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_date?: string
          created_at?: string
          id?: string
          license_id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_billing_history_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          assigned_store_id: string | null
          assigned_to: string | null
          created_at: string
          effective_date: string
          expiry_date: string | null
          id: string
          last_used_at: string | null
          license_type: string
          monthly_price: number | null
          next_billing_date: string | null
          org_id: string
          status: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          assigned_store_id?: string | null
          assigned_to?: string | null
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          id?: string
          last_used_at?: string | null
          license_type: string
          monthly_price?: number | null
          next_billing_date?: string | null
          org_id: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          assigned_store_id?: string | null
          assigned_to?: string | null
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          last_used_at?: string | null
          license_type?: string
          monthly_price?: number | null
          next_billing_date?: string | null
          org_id?: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_assigned_store_id_fkey"
            columns: ["assigned_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          id: string
          is_return: boolean | null
          line_total: number
          metadata: Json | null
          org_id: string | null
          payment_method: string | null
          product_id: string | null
          purchase_id: string | null
          quantity: number
          store_id: string | null
          tax_amount: number | null
          transaction_date: string
          transaction_hour: number | null
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          is_return?: boolean | null
          line_total: number
          metadata?: Json | null
          org_id?: string | null
          payment_method?: string | null
          product_id?: string | null
          purchase_id?: string | null
          quantity?: number
          store_id?: string | null
          tax_amount?: number | null
          transaction_date: string
          transaction_hour?: number | null
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          is_return?: boolean | null
          line_total?: number
          metadata?: Json | null
          org_id?: string | null
          payment_method?: string | null
          product_id?: string | null
          purchase_id?: string | null
          quantity?: number
          store_id?: string | null
          tax_amount?: number | null
          transaction_date?: string
          transaction_hour?: number | null
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "line_items_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_purchase_fk"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      model_3d_files: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          status: string | null
          store_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          status?: string | null
          store_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          status?: string | null
          store_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_3d_files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_3d_files_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          model_type: string
          name: string
          org_id: string | null
          status: string
          target_entity: string
          updated_at: string
          version: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          model_type: string
          name: string
          org_id?: string | null
          status?: string
          target_entity: string
          updated_at?: string
          version: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          model_type?: string
          name?: string
          org_id?: string | null
          status?: string
          target_entity?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          id: string
          notification_types: Json | null
          org_id: string | null
          slack_enabled: boolean | null
          slack_webhook_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          notification_types?: Json | null
          org_id?: string | null
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          notification_types?: Json | null
          org_id?: string | null
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          business_type: string | null
          completed_at: string | null
          completed_steps: number[] | null
          created_at: string | null
          current_step: number
          data_sources: string[] | null
          id: string
          last_activity_at: string | null
          org_id: string
          primary_goals: string[] | null
          selected_template: string | null
          skipped_steps: number[] | null
          started_at: string | null
          steps_status: Json | null
          store_count: number | null
          total_steps: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_type?: string | null
          completed_at?: string | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number
          data_sources?: string[] | null
          id?: string
          last_activity_at?: string | null
          org_id: string
          primary_goals?: string[] | null
          selected_template?: string | null
          skipped_steps?: number[] | null
          started_at?: string | null
          steps_status?: Json | null
          store_count?: number | null
          total_steps?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_type?: string | null
          completed_at?: string | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number
          data_sources?: string[] | null
          id?: string
          last_activity_at?: string | null
          org_id?: string
          primary_goals?: string[] | null
          selected_template?: string | null
          skipped_steps?: number[] | null
          started_at?: string | null
          steps_status?: Json | null
          store_count?: number | null
          total_steps?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_entity_mappings: {
        Row: {
          created_at: string | null
          data_source_id: string
          filter_condition: string | null
          id: string
          is_active: boolean | null
          label_template: string
          priority: number | null
          property_mappings: Json
          source_table: string
          target_entity_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_source_id: string
          filter_condition?: string | null
          id?: string
          is_active?: boolean | null
          label_template?: string
          priority?: number | null
          property_mappings?: Json
          source_table: string
          target_entity_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_source_id?: string
          filter_condition?: string | null
          id?: string
          is_active?: boolean | null
          label_template?: string
          priority?: number | null
          property_mappings?: Json
          source_table?: string
          target_entity_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_entity_mappings_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_entity_mappings_target_entity_type_id_fkey"
            columns: ["target_entity_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_entity_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_entity_types: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          label: string
          model_3d_dimensions: Json | null
          model_3d_metadata: Json | null
          model_3d_type: string | null
          model_3d_url: string | null
          name: string
          org_id: string | null
          priority: string | null
          properties: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label: string
          model_3d_dimensions?: Json | null
          model_3d_metadata?: Json | null
          model_3d_type?: string | null
          model_3d_url?: string | null
          name: string
          org_id?: string | null
          priority?: string | null
          properties?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          model_3d_dimensions?: Json | null
          model_3d_metadata?: Json | null
          model_3d_type?: string | null
          model_3d_url?: string | null
          name?: string
          org_id?: string | null
          priority?: string | null
          properties?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ontology_mapping_cache: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          data_type: string
          entity_mappings: Json
          file_name_pattern: string
          id: string
          last_used_at: string | null
          org_id: string | null
          relation_mappings: Json
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          data_type: string
          entity_mappings: Json
          file_name_pattern: string
          id?: string
          last_used_at?: string | null
          org_id?: string | null
          relation_mappings: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          data_type?: string
          entity_mappings?: Json
          file_name_pattern?: string
          id?: string
          last_used_at?: string | null
          org_id?: string | null
          relation_mappings?: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ontology_relation_inference_queue: {
        Row: {
          created_at: string
          entity_id: string
          error_message: string | null
          id: string
          org_id: string | null
          processed_at: string | null
          retry_count: number
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          error_message?: string | null
          id?: string
          org_id?: string | null
          processed_at?: string | null
          retry_count?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          error_message?: string | null
          id?: string
          org_id?: string | null
          processed_at?: string | null
          retry_count?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relation_inference_queue_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_relation_mappings: {
        Row: {
          created_at: string | null
          data_source_id: string
          id: string
          is_active: boolean | null
          property_mappings: Json | null
          source_entity_resolver: Json
          source_table: string
          target_entity_resolver: Json
          target_relation_type_id: string
        }
        Insert: {
          created_at?: string | null
          data_source_id: string
          id?: string
          is_active?: boolean | null
          property_mappings?: Json | null
          source_entity_resolver?: Json
          source_table: string
          target_entity_resolver?: Json
          target_relation_type_id: string
        }
        Update: {
          created_at?: string | null
          data_source_id?: string
          id?: string
          is_active?: boolean | null
          property_mappings?: Json | null
          source_entity_resolver?: Json
          source_table?: string
          target_entity_resolver?: Json
          target_relation_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relation_mappings_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relation_mappings_target_relation_type_id_fkey"
            columns: ["target_relation_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_relation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_relation_types: {
        Row: {
          created_at: string | null
          description: string | null
          directionality: string | null
          id: string
          label: string
          name: string
          org_id: string | null
          priority: string | null
          properties: Json | null
          source_entity_type: string
          target_entity_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          directionality?: string | null
          id?: string
          label: string
          name: string
          org_id?: string | null
          priority?: string | null
          properties?: Json | null
          source_entity_type: string
          target_entity_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          directionality?: string | null
          id?: string
          label?: string
          name?: string
          org_id?: string | null
          priority?: string | null
          properties?: Json | null
          source_entity_type?: string
          target_entity_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ontology_schema_versions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          org_id: string | null
          schema_data: Json
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string | null
          schema_data: Json
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string | null
          schema_data?: Json
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      ontology_schemas: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_master: boolean
          schema_definition: Json
          schema_name: string
          schema_type: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_master?: boolean
          schema_definition: Json
          schema_name: string
          schema_type: string
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_master?: boolean
          schema_definition?: Json
          schema_name?: string
          schema_type?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      optimization_feedback: {
        Row: {
          action: string
          ai_confidence: number | null
          created_at: string | null
          feedback_by: string | null
          feedback_target_type: string
          id: string
          modified_suggestion: Json | null
          optimization_id: string | null
          original_suggestion: Json | null
          reason_code: string | null
          reason_text: string | null
          store_id: string
          target_id: string | null
          vmd_rules_applied: string[] | null
        }
        Insert: {
          action: string
          ai_confidence?: number | null
          created_at?: string | null
          feedback_by?: string | null
          feedback_target_type: string
          id?: string
          modified_suggestion?: Json | null
          optimization_id?: string | null
          original_suggestion?: Json | null
          reason_code?: string | null
          reason_text?: string | null
          store_id: string
          target_id?: string | null
          vmd_rules_applied?: string[] | null
        }
        Update: {
          action?: string
          ai_confidence?: number | null
          created_at?: string | null
          feedback_by?: string | null
          feedback_target_type?: string
          id?: string
          modified_suggestion?: Json | null
          optimization_id?: string | null
          original_suggestion?: Json | null
          reason_code?: string | null
          reason_text?: string | null
          store_id?: string
          target_id?: string | null
          vmd_rules_applied?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_feedback_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          input_params: Json | null
          org_id: string | null
          output_result: Json | null
          priority: number | null
          scheduled_at: string | null
          simulation_id: string | null
          started_at: string | null
          status: string | null
          store_id: string
          strategy_id: string | null
          task_name: string | null
          task_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          input_params?: Json | null
          org_id?: string | null
          output_result?: Json | null
          priority?: number | null
          scheduled_at?: string | null
          simulation_id?: string | null
          started_at?: string | null
          status?: string | null
          store_id: string
          strategy_id?: string | null
          task_name?: string | null
          task_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          input_params?: Json | null
          org_id?: string | null
          output_result?: Json | null
          priority?: number | null
          scheduled_at?: string | null
          simulation_id?: string | null
          started_at?: string | null
          status?: string | null
          store_id?: string
          strategy_id?: string | null
          task_name?: string | null
          task_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_tasks_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulation_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_tasks_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "applied_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          license_id: string | null
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          license_id?: string | null
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          license_id?: string | null
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          brand_color: string | null
          created_at: string | null
          currency: string | null
          default_kpi_set: string | null
          email_notifications: boolean | null
          id: string
          logo_url: string | null
          metadata: Json | null
          org_id: string
          slack_notifications: boolean | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string | null
          currency?: string | null
          default_kpi_set?: string | null
          email_notifications?: boolean | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          org_id: string
          slack_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string | null
          currency?: string | null
          default_kpi_set?: string | null
          email_notifications?: boolean | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          org_id?: string
          slack_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          member_count: number | null
          metadata: Json | null
          org_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          member_count?: number | null
          metadata?: Json | null
          org_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          member_count?: number | null
          metadata?: Json | null
          org_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pos_integrations: {
        Row: {
          access_token_encrypted: string | null
          created_at: string | null
          credentials_encrypted: Json | null
          field_mappings: Json | null
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          org_id: string
          provider: string
          provider_store_id: string | null
          refresh_token_encrypted: string | null
          status: string | null
          store_id: string
          sync_enabled: boolean | null
          sync_frequency_minutes: number | null
          token_expires_at: string | null
          updated_at: string | null
          webhook_events: Json | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string | null
          credentials_encrypted?: Json | null
          field_mappings?: Json | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          org_id: string
          provider: string
          provider_store_id?: string | null
          refresh_token_encrypted?: string | null
          status?: string | null
          store_id: string
          sync_enabled?: boolean | null
          sync_frequency_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_events?: Json | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string | null
          credentials_encrypted?: Json | null
          field_mappings?: Json | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          org_id?: string
          provider?: string
          provider_store_id?: string | null
          refresh_token_encrypted?: string | null
          status?: string | null
          store_id?: string
          sync_enabled?: boolean | null
          sync_frequency_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_events?: Json | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_records: {
        Row: {
          actual_value: number | null
          context: Json | null
          id: string
          predicted_value: number
          prediction_date: string
          prediction_type: string
          store_id: string
        }
        Insert: {
          actual_value?: number | null
          context?: Json | null
          id?: string
          predicted_value: number
          prediction_date: string
          prediction_type: string
          store_id: string
        }
        Update: {
          actual_value?: number | null
          context?: Json | null
          id?: string
          predicted_value?: number
          prediction_date?: string
          prediction_type?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_associations: {
        Row: {
          analysis_period_end: string | null
          analysis_period_start: string | null
          antecedent_category: string | null
          antecedent_product_id: string
          avg_basket_value: number | null
          category_pair: string | null
          co_occurrence_count: number | null
          confidence: number
          consequent_category: string | null
          consequent_product_id: string
          conviction: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          lift: number
          metadata: Json | null
          org_id: string | null
          placement_type: string | null
          rule_strength: string | null
          rule_type: string | null
          sample_transaction_count: number | null
          store_id: string
          support: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          antecedent_category?: string | null
          antecedent_product_id: string
          avg_basket_value?: number | null
          category_pair?: string | null
          co_occurrence_count?: number | null
          confidence?: number
          consequent_category?: string | null
          consequent_product_id: string
          conviction?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          lift?: number
          metadata?: Json | null
          org_id?: string | null
          placement_type?: string | null
          rule_strength?: string | null
          rule_type?: string | null
          sample_transaction_count?: number | null
          store_id: string
          support?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          antecedent_category?: string | null
          antecedent_product_id?: string
          avg_basket_value?: number | null
          category_pair?: string | null
          co_occurrence_count?: number | null
          confidence?: number
          consequent_category?: string | null
          consequent_product_id?: string
          conviction?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          lift?: number
          metadata?: Json | null
          org_id?: string | null
          placement_type?: string | null
          rule_strength?: string | null
          rule_type?: string | null
          sample_transaction_count?: number | null
          store_id?: string
          support?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_associations_antecedent_product_id_fkey"
            columns: ["antecedent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_associations_consequent_product_id_fkey"
            columns: ["consequent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_associations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_associations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_models: {
        Row: {
          created_at: string | null
          display_type: string
          id: string
          is_default: boolean | null
          model_3d_url: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_type: string
          id?: string
          is_default?: boolean | null
          model_3d_url: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_type?: string
          id?: string
          is_default?: boolean | null
          model_3d_url?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_models_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_performance_agg: {
        Row: {
          avg_selling_price: number | null
          calculated_at: string | null
          category_rank: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          discount_rate: number | null
          id: string
          metadata: Json | null
          org_id: string | null
          product_id: string | null
          return_rate: number | null
          revenue: number | null
          stock_level: number | null
          stockout_hours: number | null
          store_id: string | null
          store_rank: number | null
          transactions: number | null
          units_sold: number | null
        }
        Insert: {
          avg_selling_price?: number | null
          calculated_at?: string | null
          category_rank?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          discount_rate?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          return_rate?: number | null
          revenue?: number | null
          stock_level?: number | null
          stockout_hours?: number | null
          store_id?: string | null
          store_rank?: number | null
          transactions?: number | null
          units_sold?: number | null
        }
        Update: {
          avg_selling_price?: number | null
          calculated_at?: string | null
          category_rank?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          discount_rate?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          return_rate?: number | null
          revenue?: number | null
          stock_level?: number | null
          stockout_hours?: number | null
          store_id?: string | null
          store_rank?: number | null
          transactions?: number | null
          units_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_performance_agg_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_agg_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_agg_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_placements: {
        Row: {
          created_at: string | null
          display_type: string
          id: string
          is_active: boolean | null
          org_id: string | null
          placed_at: string | null
          position_offset: Json | null
          product_id: string
          quantity: number | null
          rotation_offset: Json | null
          scale: Json | null
          slot_id: string
          store_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_type: string
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          placed_at?: string | null
          position_offset?: Json | null
          product_id: string
          quantity?: number | null
          rotation_offset?: Json | null
          scale?: Json | null
          slot_id: string
          store_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_type?: string
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          placed_at?: string | null
          position_offset?: Json | null
          product_id?: string
          quantity?: number | null
          rotation_offset?: Json | null
          scale?: Json | null
          slot_id?: string
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_placements_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_placements_slot"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "furniture_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_placements_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          compatible_display_types: string[] | null
          cost_price: number | null
          created_at: string
          cross_sell_product_ids: string[] | null
          description: string | null
          display_type: string | null
          id: string
          initial_furniture_id: string | null
          margin_rate: number | null
          model_3d_position: Json | null
          model_3d_rotation: Json | null
          model_3d_scale: Json | null
          model_3d_url: string | null
          movable: boolean | null
          org_id: string | null
          price: number | null
          product_name: string
          sku: string | null
          slot_id: string | null
          stock: number | null
          store_id: string | null
          supplier: string | null
          turnover_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          compatible_display_types?: string[] | null
          cost_price?: number | null
          created_at?: string
          cross_sell_product_ids?: string[] | null
          description?: string | null
          display_type?: string | null
          id?: string
          initial_furniture_id?: string | null
          margin_rate?: number | null
          model_3d_position?: Json | null
          model_3d_rotation?: Json | null
          model_3d_scale?: Json | null
          model_3d_url?: string | null
          movable?: boolean | null
          org_id?: string | null
          price?: number | null
          product_name: string
          sku?: string | null
          slot_id?: string | null
          stock?: number | null
          store_id?: string | null
          supplier?: string | null
          turnover_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          compatible_display_types?: string[] | null
          cost_price?: number | null
          created_at?: string
          cross_sell_product_ids?: string[] | null
          description?: string | null
          display_type?: string | null
          id?: string
          initial_furniture_id?: string | null
          margin_rate?: number | null
          model_3d_position?: Json | null
          model_3d_rotation?: Json | null
          model_3d_scale?: Json | null
          model_3d_url?: string | null
          movable?: boolean | null
          org_id?: string | null
          price?: number | null
          product_name?: string
          sku?: string | null
          slot_id?: string | null
          stock?: number | null
          store_id?: string | null
          supplier?: string | null
          turnover_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_org_id_new"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_store_id_new"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          org_id: string | null
          product_id: string | null
          purchase_date: string
          quantity: number
          store_id: string | null
          total_price: number
          unit_price: number
          user_id: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          org_id?: string | null
          product_id?: string | null
          purchase_date: string
          quantity: number
          store_id?: string | null
          total_price: number
          unit_price: number
          user_id: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          org_id?: string | null
          product_id?: string | null
          purchase_date?: string
          quantity?: number
          store_id?: string | null
          total_price?: number
          unit_price?: number
          user_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quickstart_guides: {
        Row: {
          auto_show: boolean | null
          created_at: string | null
          description: string | null
          guide_key: string
          id: string
          is_active: boolean | null
          priority: number | null
          show_once: boolean | null
          steps: Json
          target_page: string
          target_role: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_show?: boolean | null
          created_at?: string | null
          description?: string | null
          guide_key: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          show_once?: boolean | null
          steps?: Json
          target_page: string
          target_role?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_show?: boolean | null
          created_at?: string | null
          description?: string | null
          guide_key?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          show_once?: boolean | null
          steps?: Json
          target_page?: string
          target_role?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      raw_imports: {
        Row: {
          api_connection_id: string | null
          api_response_meta: Json | null
          completed_at: string | null
          created_at: string | null
          data_type: string | null
          error_details: Json | null
          error_message: string | null
          etl_version: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          processed_at: string | null
          progress: Json | null
          raw_data: Json | null
          row_count: number | null
          session_id: string | null
          source_name: string | null
          source_type: string
          started_at: string | null
          status: string | null
          store_id: string | null
          sync_batch_id: string | null
          user_id: string
        }
        Insert: {
          api_connection_id?: string | null
          api_response_meta?: Json | null
          completed_at?: string | null
          created_at?: string | null
          data_type?: string | null
          error_details?: Json | null
          error_message?: string | null
          etl_version?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          processed_at?: string | null
          progress?: Json | null
          raw_data?: Json | null
          row_count?: number | null
          session_id?: string | null
          source_name?: string | null
          source_type: string
          started_at?: string | null
          status?: string | null
          store_id?: string | null
          sync_batch_id?: string | null
          user_id: string
        }
        Update: {
          api_connection_id?: string | null
          api_response_meta?: Json | null
          completed_at?: string | null
          created_at?: string | null
          data_type?: string | null
          error_details?: Json | null
          error_message?: string | null
          etl_version?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          processed_at?: string | null
          progress?: Json | null
          raw_data?: Json | null
          row_count?: number | null
          session_id?: string | null
          source_name?: string | null
          source_type?: string
          started_at?: string | null
          status?: string | null
          store_id?: string | null
          sync_batch_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_imports_api_connection_id_fkey"
            columns: ["api_connection_id"]
            isOneToOne: false
            referencedRelation: "api_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_imports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_imports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_imports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_inventory: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string | null
          external_product_id: string
          id: string
          is_low_stock: boolean | null
          last_sale_at: string | null
          last_updated_at: string | null
          org_id: string
          pos_integration_id: string | null
          product_name: string | null
          quantity_available: number | null
          quantity_on_hand: number
          quantity_reserved: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          sku: string | null
          store_id: string
          unit_cost: number | null
          unit_price: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          external_product_id: string
          id?: string
          is_low_stock?: boolean | null
          last_sale_at?: string | null
          last_updated_at?: string | null
          org_id: string
          pos_integration_id?: string | null
          product_name?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku?: string | null
          store_id: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          external_product_id?: string
          id?: string
          is_low_stock?: boolean | null
          last_sale_at?: string | null
          last_updated_at?: string | null
          org_id?: string
          pos_integration_id?: string | null
          product_name?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku?: string | null
          store_id?: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_inventory_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_transactions: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: string | null
          customer_type: string | null
          discount_amount: number | null
          employee_id: string | null
          external_data: Json | null
          external_transaction_id: string
          id: string
          is_voided: boolean | null
          item_count: number | null
          items: Json | null
          org_id: string
          payment_method: string | null
          pos_integration_id: string | null
          processed_at: string | null
          receipt_number: string | null
          register_id: string | null
          store_id: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          transaction_date: string
          transaction_time: string
          transaction_timestamp: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_type?: string | null
          discount_amount?: number | null
          employee_id?: string | null
          external_data?: Json | null
          external_transaction_id: string
          id?: string
          is_voided?: boolean | null
          item_count?: number | null
          items?: Json | null
          org_id: string
          payment_method?: string | null
          pos_integration_id?: string | null
          processed_at?: string | null
          receipt_number?: string | null
          register_id?: string | null
          store_id: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_date: string
          transaction_time: string
          transaction_timestamp: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_type?: string | null
          discount_amount?: number | null
          employee_id?: string | null
          external_data?: Json | null
          external_transaction_id?: string
          id?: string
          is_voided?: boolean | null
          item_count?: number | null
          items?: Json | null
          org_id?: string
          payment_method?: string | null
          pos_integration_id?: string | null
          processed_at?: string | null
          receipt_number?: string | null
          register_id?: string | null
          store_id?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string
          transaction_time?: string
          transaction_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtime_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_transactions_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_applications: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          baseline_date: string
          baseline_kpis: Json
          created_at: string | null
          id: string
          measurement_end_date: string | null
          measurement_period_days: number | null
          measurement_start_date: string | null
          org_id: string
          recommendation_details: Json | null
          recommendation_summary: string | null
          recommendation_type: string
          reverted_at: string | null
          reverted_reason: string | null
          scenario_id: string | null
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          baseline_date: string
          baseline_kpis: Json
          created_at?: string | null
          id?: string
          measurement_end_date?: string | null
          measurement_period_days?: number | null
          measurement_start_date?: string | null
          org_id: string
          recommendation_details?: Json | null
          recommendation_summary?: string | null
          recommendation_type: string
          reverted_at?: string | null
          reverted_reason?: string | null
          scenario_id?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          baseline_date?: string
          baseline_kpis?: Json
          created_at?: string | null
          id?: string
          measurement_end_date?: string | null
          measurement_period_days?: number | null
          measurement_start_date?: string | null
          org_id?: string
          recommendation_details?: Json | null
          recommendation_summary?: string | null
          recommendation_type?: string
          reverted_at?: string | null
          reverted_reason?: string | null
          scenario_id?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_applications_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_applications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_data: {
        Row: {
          consumer_confidence: number | null
          created_at: string | null
          date: string
          gdp: number | null
          id: string
          is_global: boolean
          metadata: Json | null
          org_id: string | null
          population: number | null
          region: string
          unemployment_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consumer_confidence?: number | null
          created_at?: string | null
          date: string
          gdp?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          population?: number | null
          region: string
          unemployment_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consumer_confidence?: number | null
          created_at?: string | null
          date?: string
          gdp?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          population?: number | null
          region?: string
          unemployment_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string | null
          filters: Json | null
          frequency: string
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          org_id: string | null
          recipients: string[] | null
          report_name: string
          report_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          frequency: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string | null
          recipients?: string[] | null
          report_name: string
          report_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string | null
          recipients?: string[] | null
          report_name?: string
          report_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_concept_values: {
        Row: {
          computed_at: string | null
          concept_id: string
          id: string
          parameters: Json | null
          store_id: string
          valid_until: string | null
          value: Json
        }
        Insert: {
          computed_at?: string | null
          concept_id: string
          id?: string
          parameters?: Json | null
          store_id: string
          valid_until?: string | null
          value: Json
        }
        Update: {
          computed_at?: string | null
          concept_id?: string
          id?: string
          parameters?: Json | null
          store_id?: string
          valid_until?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "retail_concept_values_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "retail_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retail_concept_values_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_concepts: {
        Row: {
          ai_context: Json
          category: string
          computation: Json
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          involved_entity_types: string[] | null
          involved_relation_types: string[] | null
          is_active: boolean | null
          is_system: boolean | null
          name: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_context?: Json
          category: string
          computation?: Json
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          involved_entity_types?: string[] | null
          involved_relation_types?: string[] | null
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_context?: Json
          category?: string
          computation?: Json
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          involved_entity_types?: string[] | null
          involved_relation_types?: string[] | null
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retail_concepts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_knowledge_chunks: {
        Row: {
          chunk_type: string
          conditions: Json | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          insight_id: string | null
          source: string | null
          title: string
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          chunk_type: string
          conditions?: Json | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          insight_id?: string | null
          source?: string | null
          title: string
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          chunk_type?: string
          conditions?: Json | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          insight_id?: string | null
          source?: string | null
          title?: string
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roi_measurements: {
        Row: {
          application_id: string
          created_at: string | null
          estimated_annual_impact: Json | null
          id: string
          is_positive_impact: boolean | null
          kpi_changes: Json
          measured_kpis: Json
          measurement_days: number
          measurement_end_date: string
          measurement_start_date: string
          org_id: string
          statistical_significance: Json | null
          summary_text: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          estimated_annual_impact?: Json | null
          id?: string
          is_positive_impact?: boolean | null
          kpi_changes: Json
          measured_kpis: Json
          measurement_days: number
          measurement_end_date: string
          measurement_start_date: string
          org_id: string
          statistical_significance?: Json | null
          summary_text?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          estimated_annual_impact?: Json | null
          id?: string
          is_positive_impact?: boolean | null
          kpi_changes?: Json
          measured_kpis?: Json
          measurement_days?: number
          measurement_end_date?: string
          measurement_start_date?: string
          org_id?: string
          statistical_significance?: Json | null
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_measurements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recommendation_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roi_measurements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_data_templates: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          entity_types: Json | null
          estimated_setup_minutes: number | null
          furniture_models: Json | null
          id: string
          is_active: boolean | null
          preview_image_url: string | null
          product_models: Json | null
          relation_types: Json | null
          sample_entities: Json | null
          sample_kpis: Json | null
          sample_products: Json | null
          sample_relations: Json | null
          sample_transactions: Json | null
          sample_visits: Json | null
          sort_order: number | null
          store_3d_model_url: string | null
          store_config: Json | null
          template_name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          entity_types?: Json | null
          estimated_setup_minutes?: number | null
          furniture_models?: Json | null
          id?: string
          is_active?: boolean | null
          preview_image_url?: string | null
          product_models?: Json | null
          relation_types?: Json | null
          sample_entities?: Json | null
          sample_kpis?: Json | null
          sample_products?: Json | null
          sample_relations?: Json | null
          sample_transactions?: Json | null
          sample_visits?: Json | null
          sort_order?: number | null
          store_3d_model_url?: string | null
          store_config?: Json | null
          template_name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          entity_types?: Json | null
          estimated_setup_minutes?: number | null
          furniture_models?: Json | null
          id?: string
          is_active?: boolean | null
          preview_image_url?: string | null
          product_models?: Json | null
          relation_types?: Json | null
          sample_entities?: Json | null
          sample_kpis?: Json | null
          sample_products?: Json | null
          sample_relations?: Json | null
          sample_transactions?: Json | null
          sample_visits?: Json | null
          sort_order?: number | null
          store_3d_model_url?: string | null
          store_config?: Json | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          parameters: Json
          predicted_kpi: Json | null
          results: Json | null
          scenario_name: string
          scenario_type: string
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          parameters: Json
          predicted_kpi?: Json | null
          results?: Json | null
          scenario_name: string
          scenario_type: string
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          parameters?: Json
          predicted_kpi?: Json | null
          results?: Json | null
          scenario_name?: string
          scenario_type?: string
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_schedules: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          break_minutes: number | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          org_id: string | null
          shift_date: string
          staff_id: string | null
          start_time: string
          status: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          break_minutes?: number | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          org_id?: string | null
          shift_date: string
          staff_id?: string | null
          start_time: string
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          break_minutes?: number | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          shift_date?: string
          staff_id?: string | null
          start_time?: string
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_fk"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_configs: {
        Row: {
          config_name: string
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          parameters: Json
          results: Json | null
          simulation_type: string
          status: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          config_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          parameters?: Json
          results?: Json | null
          simulation_type: string
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          config_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          parameters?: Json
          results?: Json | null
          simulation_type?: string
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_configs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_configs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          metrics: Json | null
          org_id: string | null
          params: Json | null
          result: Json | null
          simulation_name: string | null
          simulation_type: string
          started_at: string | null
          status: string | null
          store_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metrics?: Json | null
          org_id?: string | null
          params?: Json | null
          result?: Json | null
          simulation_name?: string | null
          simulation_type: string
          started_at?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metrics?: Json | null
          org_id?: string | null
          params?: Json | null
          result?: Json | null
          simulation_name?: string | null
          simulation_type?: string
          started_at?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          assigned_zone_id: string | null
          avatar_position: Json | null
          avatar_rotation: Json | null
          avatar_scale: Json | null
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          org_id: string | null
          phone: string | null
          role: string | null
          staff_code: string | null
          staff_name: string
          store_id: string | null
          updated_at: string | null
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          assigned_zone_id?: string | null
          avatar_position?: Json | null
          avatar_rotation?: Json | null
          avatar_scale?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          phone?: string | null
          role?: string | null
          staff_code?: string | null
          staff_name: string
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          assigned_zone_id?: string | null
          avatar_position?: Json | null
          avatar_rotation?: Json | null
          avatar_scale?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          phone?: string | null
          role?: string | null
          staff_code?: string | null
          staff_name?: string
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          efficiency_score: number | null
          id: string
          is_ai_suggested: boolean | null
          optimization_task_id: string | null
          org_id: string | null
          position_x: number | null
          position_y: number | null
          position_z: number | null
          properties: Json | null
          shift_end: string | null
          shift_start: string | null
          staff_name: string | null
          staff_role: string | null
          status: string | null
          store_id: string
          updated_at: string | null
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          efficiency_score?: number | null
          id?: string
          is_ai_suggested?: boolean | null
          optimization_task_id?: string | null
          org_id?: string | null
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          properties?: Json | null
          shift_end?: string | null
          shift_start?: string | null
          staff_name?: string | null
          staff_role?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          efficiency_score?: number | null
          id?: string
          is_ai_suggested?: boolean | null
          optimization_task_id?: string | null
          org_id?: string | null
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          properties?: Json | null
          shift_end?: string | null
          shift_start?: string | null
          staff_name?: string | null
          staff_role?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_optimization_task_id_fkey"
            columns: ["optimization_task_id"]
            isOneToOne: false
            referencedRelation: "optimization_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      store_comments: {
        Row: {
          author_name: string
          author_role: Database["public"]["Enums"]["app_role"]
          comment: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          org_id: string
          parent_comment_id: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author_name: string
          author_role: Database["public"]["Enums"]["app_role"]
          comment: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          org_id: string
          parent_comment_id?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author_name?: string
          author_role?: Database["public"]["Enums"]["app_role"]
          comment?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          org_id?: string
          parent_comment_id?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "store_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_comments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          org_id: string
          period_end: string
          period_start: string
          period_type: string
          store_id: string
          target_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          org_id: string
          period_end: string
          period_start: string
          period_type: string
          store_id: string
          target_value: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          org_id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          store_id?: string
          target_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      store_personas: {
        Row: {
          confidence_adjustments: Json | null
          created_at: string | null
          feedback_stats: Json | null
          id: string
          is_active: boolean | null
          last_learning_at: string | null
          learned_context: Json | null
          learning_version: number | null
          preference_weights: Json | null
          store_id: string
          store_style: string | null
          target_demographic: string | null
          updated_at: string | null
          vmd_preferences: Json | null
        }
        Insert: {
          confidence_adjustments?: Json | null
          created_at?: string | null
          feedback_stats?: Json | null
          id?: string
          is_active?: boolean | null
          last_learning_at?: string | null
          learned_context?: Json | null
          learning_version?: number | null
          preference_weights?: Json | null
          store_id: string
          store_style?: string | null
          target_demographic?: string | null
          updated_at?: string | null
          vmd_preferences?: Json | null
        }
        Update: {
          confidence_adjustments?: Json | null
          created_at?: string | null
          feedback_stats?: Json | null
          id?: string
          is_active?: boolean | null
          last_learning_at?: string | null
          learned_context?: Json | null
          learning_version?: number | null
          preference_weights?: Json | null
          store_id?: string
          store_style?: string | null
          target_demographic?: string | null
          updated_at?: string | null
          vmd_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "store_personas_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_scenes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          org_id: string | null
          recipe_data: Json | null
          scene_name: string
          scene_type: string | null
          staff_positions: Json | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          recipe_data?: Json | null
          scene_name: string
          scene_type?: string | null
          staff_positions?: Json | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          recipe_data?: Json | null
          scene_name?: string
          scene_type?: string | null
          staff_positions?: Json | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_scenes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_scenes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_trade_area_context: {
        Row: {
          categories: Json | null
          created_at: string | null
          id: string
          org_id: string | null
          provider: string
          radius_m: number
          raw_payload: Json | null
          stats: Json | null
          store_id: string | null
          total_pois: number
          updated_at: string | null
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider: string
          radius_m: number
          raw_payload?: Json | null
          stats?: Json | null
          store_id?: string | null
          total_pois?: number
          updated_at?: string | null
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider?: string
          radius_m?: number
          raw_payload?: Json | null
          stats?: Json | null
          store_id?: string | null
          total_pois?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_trade_area_context_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_trade_area_context_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_visits: {
        Row: {
          created_at: string | null
          customer_id: string | null
          data_source: string | null
          device_type: string | null
          duration_minutes: number | null
          entry_point: string | null
          exit_date: string | null
          id: string
          made_purchase: boolean | null
          org_id: string
          purchase_amount: number | null
          store_id: string
          transaction_id: string | null
          visit_date: string
          zone_durations: Json | null
          zones_visited: string[] | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          data_source?: string | null
          device_type?: string | null
          duration_minutes?: number | null
          entry_point?: string | null
          exit_date?: string | null
          id?: string
          made_purchase?: boolean | null
          org_id: string
          purchase_amount?: number | null
          store_id: string
          transaction_id?: string | null
          visit_date?: string
          zone_durations?: Json | null
          zones_visited?: string[] | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          data_source?: string | null
          device_type?: string | null
          duration_minutes?: number | null
          entry_point?: string | null
          exit_date?: string | null
          id?: string
          made_purchase?: boolean | null
          org_id?: string
          purchase_amount?: number | null
          store_id?: string
          transaction_id?: string | null
          visit_date?: string
          zone_durations?: Json | null
          zones_visited?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "store_visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stored_model_parameters: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          parameter_key: string
          parameter_value: number
          prediction_type: string
          store_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parameter_key: string
          parameter_value: number
          prediction_type: string
          store_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parameter_key?: string
          parameter_value?: number
          prediction_type?: string
          store_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stored_model_parameters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          area_sqm: number | null
          city: string | null
          closing_hour: number | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          floor_area_sqm: number | null
          hq_store_code: string | null
          id: string
          is_active: boolean | null
          license_id: string | null
          location: string | null
          manager_name: string | null
          max_capacity: number | null
          metadata: Json | null
          model_3d_url: string | null
          model_url: string | null
          opening_date: string | null
          opening_hour: number | null
          org_id: string | null
          phone: string | null
          region: string | null
          staff_count: number | null
          status: string | null
          store_code: string | null
          store_format: string | null
          store_name: string
          store_type: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          closing_hour?: number | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          floor_area_sqm?: number | null
          hq_store_code?: string | null
          id?: string
          is_active?: boolean | null
          license_id?: string | null
          location?: string | null
          manager_name?: string | null
          max_capacity?: number | null
          metadata?: Json | null
          model_3d_url?: string | null
          model_url?: string | null
          opening_date?: string | null
          opening_hour?: number | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          staff_count?: number | null
          status?: string | null
          store_code?: string | null
          store_format?: string | null
          store_name: string
          store_type?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          closing_hour?: number | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          floor_area_sqm?: number | null
          hq_store_code?: string | null
          id?: string
          is_active?: boolean | null
          license_id?: string | null
          location?: string | null
          manager_name?: string | null
          max_capacity?: number | null
          metadata?: Json | null
          model_3d_url?: string | null
          model_url?: string | null
          opening_date?: string | null
          opening_hour?: number | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          staff_count?: number | null
          status?: string | null
          store_code?: string | null
          store_format?: string | null
          store_name?: string
          store_type?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stores_license_id_new"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stores_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stores_org_id_new"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_daily_metrics: {
        Row: {
          created_at: string | null
          cumulative_roi: number | null
          daily_roi: number | null
          date: string
          id: string
          metrics: Json
          strategy_id: string
        }
        Insert: {
          created_at?: string | null
          cumulative_roi?: number | null
          daily_roi?: number | null
          date: string
          id?: string
          metrics?: Json
          strategy_id: string
        }
        Update: {
          created_at?: string | null
          cumulative_roi?: number | null
          daily_roi?: number | null
          date?: string
          id?: string
          metrics?: Json
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_daily_metrics_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "applied_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_feedback: {
        Row: {
          actual_metrics: Json | null
          actual_roi: number | null
          ai_recommendation: Json
          applied_at: string | null
          baseline_metrics: Json | null
          created_at: string | null
          expected_roi: number | null
          feedback_type: string | null
          id: string
          learnings: Json | null
          measurement_end_date: string | null
          measurement_period_days: number | null
          measurement_start_date: string | null
          org_id: string
          result_measured: boolean | null
          roi_accuracy: number | null
          store_id: string
          strategy_id: string | null
          strategy_type: string
          updated_at: string | null
          was_applied: boolean | null
        }
        Insert: {
          actual_metrics?: Json | null
          actual_roi?: number | null
          ai_recommendation: Json
          applied_at?: string | null
          baseline_metrics?: Json | null
          created_at?: string | null
          expected_roi?: number | null
          feedback_type?: string | null
          id?: string
          learnings?: Json | null
          measurement_end_date?: string | null
          measurement_period_days?: number | null
          measurement_start_date?: string | null
          org_id: string
          result_measured?: boolean | null
          roi_accuracy?: number | null
          store_id: string
          strategy_id?: string | null
          strategy_type: string
          updated_at?: string | null
          was_applied?: boolean | null
        }
        Update: {
          actual_metrics?: Json | null
          actual_roi?: number | null
          ai_recommendation?: Json
          applied_at?: string | null
          baseline_metrics?: Json | null
          created_at?: string | null
          expected_roi?: number | null
          feedback_type?: string | null
          id?: string
          learnings?: Json | null
          measurement_end_date?: string | null
          measurement_period_days?: number | null
          measurement_start_date?: string | null
          org_id?: string
          result_measured?: boolean | null
          roi_accuracy?: number | null
          store_id?: string
          strategy_id?: string | null
          strategy_type?: string
          updated_at?: string | null
          was_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_feedback_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_feedback_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_feedback_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "applied_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          end_date: string | null
          hq_license_count: number
          hq_seat_quota: number | null
          id: string
          metadata: Json | null
          monthly_cost: number
          org_id: string
          plan_type: string | null
          start_date: string | null
          status: string
          store_license_count: number
          store_quota: number | null
          subscription_type: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string | null
          hq_license_count?: number
          hq_seat_quota?: number | null
          id?: string
          metadata?: Json | null
          monthly_cost?: number
          org_id: string
          plan_type?: string | null
          start_date?: string | null
          status: string
          store_license_count?: number
          store_quota?: number | null
          subscription_type?: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string | null
          hq_license_count?: number
          hq_seat_quota?: number | null
          id?: string
          metadata?: Json | null
          monthly_cost?: number
          org_id?: string
          plan_type?: string | null
          start_date?: string | null
          status?: string
          store_license_count?: number
          store_quota?: number | null
          subscription_type?: string
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_endpoints: {
        Row: {
          api_connection_id: string
          created_at: string | null
          data_path: string | null
          description: string | null
          endpoint_path: string
          http_method: string | null
          id: string
          incremental_key: string | null
          incremental_value: string | null
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_record_count: number | null
          last_sync_status: string | null
          name: string
          org_id: string | null
          pagination_config: Json | null
          query_params: Json | null
          sync_frequency: string | null
          sync_mode: string | null
          target_table: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_connection_id: string
          created_at?: string | null
          data_path?: string | null
          description?: string | null
          endpoint_path: string
          http_method?: string | null
          id?: string
          incremental_key?: string | null
          incremental_value?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_record_count?: number | null
          last_sync_status?: string | null
          name: string
          org_id?: string | null
          pagination_config?: Json | null
          query_params?: Json | null
          sync_frequency?: string | null
          sync_mode?: string | null
          target_table: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_connection_id?: string
          created_at?: string | null
          data_path?: string | null
          description?: string | null
          endpoint_path?: string
          http_method?: string | null
          id?: string
          incremental_key?: string | null
          incremental_value?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_record_count?: number | null
          last_sync_status?: string | null
          name?: string
          org_id?: string | null
          pagination_config?: Json | null
          query_params?: Json | null
          sync_frequency?: string | null
          sync_mode?: string | null
          target_table?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_endpoints_api_connection_id_fkey"
            columns: ["api_connection_id"]
            isOneToOne: false
            referencedRelation: "api_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_endpoints_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          org_id: string
          pos_integration_id: string
          records_created: number | null
          records_failed: number | null
          records_fetched: number | null
          records_updated: number | null
          status: string | null
          sync_ended_at: string | null
          sync_started_at: string | null
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          org_id: string
          pos_integration_id: string
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          status?: string | null
          sync_ended_at?: string | null
          sync_started_at?: string | null
          sync_type: string
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          org_id?: string
          pos_integration_id?: string
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          status?: string | null
          sync_ended_at?: string | null
          sync_started_at?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          assigned_to_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          priority: string
          status: string
          store_id: string | null
          task_code: string | null
          task_name: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          priority?: string
          status?: string
          store_id?: string | null
          task_code?: string | null
          task_name: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          priority?: string
          status?: string
          store_id?: string | null
          task_code?: string | null
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          channel: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          metadata: Json | null
          net_amount: number | null
          org_id: string | null
          payment_method: string | null
          store_id: string | null
          total_amount: number | null
          transaction_datetime: string
          user_id: string | null
          visit_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          org_id?: string | null
          payment_method?: string | null
          store_id?: string | null
          total_amount?: number | null
          transaction_datetime: string
          user_id?: string | null
          visit_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          org_id?: string | null
          payment_method?: string | null
          store_id?: string | null
          total_amount?: number | null
          transaction_datetime?: string
          user_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_signals: {
        Row: {
          created_at: string | null
          date: string
          id: string
          index_value: number
          key: string
          metadata: Json | null
          org_id: string | null
          raw_payload: Json | null
          scope: string
          source_provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          index_value: number
          key: string
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          scope: string
          source_provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          index_value?: number
          key?: string
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          scope?: string
          source_provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_signals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          column_mapping: Json | null
          completed_at: string | null
          completed_files: number | null
          created_at: string
          failed_files: number | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          import_type: string | null
          org_id: string | null
          parsed_preview: Json | null
          processed_files: number | null
          row_count: number | null
          session_name: string | null
          started_at: string | null
          status: string
          store_id: string | null
          target_table: string | null
          total_files: number | null
          updated_at: string
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          column_mapping?: Json | null
          completed_at?: string | null
          completed_files?: number | null
          created_at?: string
          failed_files?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          import_type?: string | null
          org_id?: string | null
          parsed_preview?: Json | null
          processed_files?: number | null
          row_count?: number | null
          session_name?: string | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          target_table?: string | null
          total_files?: number | null
          updated_at?: string
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          column_mapping?: Json | null
          completed_at?: string | null
          completed_files?: number | null
          created_at?: string
          failed_files?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          import_type?: string | null
          org_id?: string | null
          parsed_preview?: Json | null
          processed_files?: number | null
          row_count?: number | null
          session_name?: string | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          target_table?: string | null
          total_files?: number | null
          updated_at?: string
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: string | null
          org_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          org_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          org_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_activity_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alerts: {
        Row: {
          action_label: string | null
          action_url: string | null
          alert_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          org_id: string
          read_at: string | null
          severity: string
          store_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          alert_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          org_id: string
          read_at?: string | null
          severity: string
          store_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          alert_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          org_id?: string
          read_at?: string | null
          severity?: string
          store_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_data_imports: {
        Row: {
          can_pause: boolean | null
          can_resume: boolean | null
          completed_at: string | null
          created_at: string
          data_type: string
          error_details: Json | null
          error_message: string | null
          failed_rows: number | null
          file_name: string
          id: string
          import_type: string | null
          imported_rows: number | null
          is_paused: boolean | null
          org_id: string | null
          progress: Json | null
          raw_data: Json | null
          rolled_back_at: string | null
          rolled_back_rows: number | null
          row_count: number | null
          started_at: string | null
          status: string
          store_id: string | null
          target_table: string | null
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_pause?: boolean | null
          can_resume?: boolean | null
          completed_at?: string | null
          created_at?: string
          data_type: string
          error_details?: Json | null
          error_message?: string | null
          failed_rows?: number | null
          file_name: string
          id?: string
          import_type?: string | null
          imported_rows?: number | null
          is_paused?: boolean | null
          org_id?: string | null
          progress?: Json | null
          raw_data?: Json | null
          rolled_back_at?: string | null
          rolled_back_rows?: number | null
          row_count?: number | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          target_table?: string | null
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_pause?: boolean | null
          can_resume?: boolean | null
          completed_at?: string | null
          created_at?: string
          data_type?: string
          error_details?: Json | null
          error_message?: string | null
          failed_rows?: number | null
          file_name?: string
          id?: string
          import_type?: string | null
          imported_rows?: number | null
          is_paused?: boolean | null
          org_id?: string | null
          progress?: Json | null
          raw_data?: Json | null
          rolled_back_at?: string | null
          rolled_back_rows?: number | null
          row_count?: number | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          target_table?: string | null
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_data_imports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_guide_completions: {
        Row: {
          completed_at: string | null
          guide_key: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          guide_key: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          guide_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      v_org_id: {
        Row: {
          id: string | null
        }
        Insert: {
          id?: string | null
        }
        Update: {
          id?: string | null
        }
        Relationships: []
      }
      visit_zone_events: {
        Row: {
          created_at: string | null
          dwell_seconds: number | null
          entry_time: string
          exit_time: string | null
          id: string
          interaction_count: number | null
          metadata: Json | null
          org_id: string | null
          path_sequence: number | null
          store_id: string | null
          visit_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          dwell_seconds?: number | null
          entry_time: string
          exit_time?: string | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          path_sequence?: number | null
          store_id?: string | null
          visit_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          dwell_seconds?: number | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          path_sequence?: number | null
          store_id?: string | null
          visit_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_zone_events_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string
          customer_id: string | null
          duration_minutes: number | null
          id: string
          org_id: string | null
          store_id: string | null
          user_id: string
          visit_date: string
          zones_visited: string[] | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          duration_minutes?: number | null
          id?: string
          org_id?: string | null
          store_id?: string | null
          user_id: string
          visit_date: string
          zones_visited?: string[] | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          duration_minutes?: number | null
          id?: string
          org_id?: string | null
          store_id?: string | null
          user_id?: string
          visit_date?: string
          zones_visited?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      vmd_rule_applications: {
        Row: {
          actual_impact: Json | null
          applied_at: string | null
          applied_by: string | null
          applied_to_fixture_id: string | null
          applied_to_product_id: string | null
          applied_to_zone_id: string | null
          id: string
          optimization_id: string | null
          rule_id: string
          store_id: string
          user_feedback: string | null
          was_accepted: boolean | null
        }
        Insert: {
          actual_impact?: Json | null
          applied_at?: string | null
          applied_by?: string | null
          applied_to_fixture_id?: string | null
          applied_to_product_id?: string | null
          applied_to_zone_id?: string | null
          id?: string
          optimization_id?: string | null
          rule_id: string
          store_id: string
          user_feedback?: string | null
          was_accepted?: boolean | null
        }
        Update: {
          actual_impact?: Json | null
          applied_at?: string | null
          applied_by?: string | null
          applied_to_fixture_id?: string | null
          applied_to_product_id?: string | null
          applied_to_zone_id?: string | null
          id?: string
          optimization_id?: string | null
          rule_id?: string
          store_id?: string
          user_feedback?: string | null
          was_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vmd_rule_applications_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "vmd_rulesets"
            referencedColumns: ["id"]
          },
        ]
      }
      vmd_rulesets: {
        Row: {
          action_parameters: Json | null
          applicable_industries: string[] | null
          applicable_store_types: string[] | null
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          description: string
          description_ko: string | null
          evidence_source: string | null
          evidence_url: string | null
          expected_impact: Json | null
          id: string
          is_active: boolean | null
          priority: number | null
          recommended_action: string
          recommended_action_ko: string | null
          rule_category: string
          rule_code: string
          rule_name: string
          rule_name_ko: string | null
          trigger_conditions: Json
          updated_at: string | null
          version: number | null
        }
        Insert: {
          action_parameters?: Json | null
          applicable_industries?: string[] | null
          applicable_store_types?: string[] | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          description_ko?: string | null
          evidence_source?: string | null
          evidence_url?: string | null
          expected_impact?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          recommended_action: string
          recommended_action_ko?: string | null
          rule_category: string
          rule_code: string
          rule_name: string
          rule_name_ko?: string | null
          trigger_conditions?: Json
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          action_parameters?: Json | null
          applicable_industries?: string[] | null
          applicable_store_types?: string[] | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          description_ko?: string | null
          evidence_source?: string | null
          evidence_url?: string | null
          expected_impact?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          recommended_action?: string
          recommended_action_ko?: string | null
          rule_category?: string
          rule_code?: string
          rule_name?: string
          rule_name_ko?: string | null
          trigger_conditions?: Json
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      vmd_zone_types: {
        Row: {
          code: string
          color_code: string | null
          description: string | null
          name: string
          traffic_weight: number | null
          typical_dwell_seconds: number | null
        }
        Insert: {
          code: string
          color_code?: string | null
          description?: string | null
          name: string
          traffic_weight?: number | null
          typical_dwell_seconds?: number | null
        }
        Update: {
          code?: string
          color_code?: string | null
          description?: string | null
          name?: string
          traffic_weight?: number | null
          typical_dwell_seconds?: number | null
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          created_at: string | null
          date: string
          humidity: number | null
          id: string
          is_global: boolean
          metadata: Json | null
          org_id: string | null
          precipitation: number | null
          store_id: string | null
          temperature: number | null
          updated_at: string | null
          user_id: string | null
          weather_condition: string | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          humidity?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          precipitation?: number | null
          store_id?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id?: string | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          humidity?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          precipitation?: number | null
          store_id?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id?: string | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_data_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      web_events: {
        Row: {
          created_at: string
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          site: string | null
        }
        Insert: {
          created_at?: string
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          site?: string | null
        }
        Update: {
          created_at?: string
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          site?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_events: {
        Row: {
          created_at: string
          device_id: string | null
          dwell_time_seconds: number | null
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          signal_strength: number | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          dwell_time_seconds?: number | null
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          signal_strength?: number | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          dwell_time_seconds?: number | null
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          signal_strength?: number | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_tracking: {
        Row: {
          created_at: string
          dwell_time_seconds: number | null
          id: string
          mac_address: string
          org_id: string | null
          session_id: string | null
          signal_strength: number | null
          store_id: string
          timestamp: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          dwell_time_seconds?: number | null
          id?: string
          mac_address: string
          org_id?: string | null
          session_id?: string | null
          signal_strength?: number | null
          store_id: string
          timestamp: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          dwell_time_seconds?: number | null
          id?: string
          mac_address?: string
          org_id?: string | null
          session_id?: string | null
          signal_strength?: number | null
          store_id?: string
          timestamp?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_tracking_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "wifi_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_zones: {
        Row: {
          coordinates: Json | null
          created_at: string
          id: string
          org_id: string | null
          store_id: string
          updated_at: string
          user_id: string
          zone_name: string
          zone_type: string | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string
          id?: string
          org_id?: string | null
          store_id: string
          updated_at?: string
          user_id: string
          zone_name: string
          zone_type?: string | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string
          id?: string
          org_id?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
          zone_name?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_daily_metrics: {
        Row: {
          avg_dwell_seconds: number | null
          calculated_at: string | null
          conversion_count: number | null
          created_at: string | null
          date: string
          entry_count: number | null
          exit_count: number | null
          heatmap_intensity: number | null
          id: string
          interaction_count: number | null
          metadata: Json | null
          org_id: string | null
          peak_hour: number | null
          peak_occupancy: number | null
          revenue_attributed: number | null
          source_trace: Json | null
          store_id: string | null
          total_dwell_seconds: number | null
          total_visitors: number | null
          unique_visitors: number | null
          zone_id: string | null
        }
        Insert: {
          avg_dwell_seconds?: number | null
          calculated_at?: string | null
          conversion_count?: number | null
          created_at?: string | null
          date: string
          entry_count?: number | null
          exit_count?: number | null
          heatmap_intensity?: number | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          peak_hour?: number | null
          peak_occupancy?: number | null
          revenue_attributed?: number | null
          source_trace?: Json | null
          store_id?: string | null
          total_dwell_seconds?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          zone_id?: string | null
        }
        Update: {
          avg_dwell_seconds?: number | null
          calculated_at?: string | null
          conversion_count?: number | null
          created_at?: string | null
          date?: string
          entry_count?: number | null
          exit_count?: number | null
          heatmap_intensity?: number | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          peak_hour?: number | null
          peak_occupancy?: number | null
          revenue_attributed?: number | null
          source_trace?: Json | null
          store_id?: string | null
          total_dwell_seconds?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_daily_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_daily_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_daily_metrics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_daily_metrics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_daily_metrics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_events: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          customer_id: string | null
          duration_seconds: number | null
          event_date: string
          event_hour: number | null
          event_timestamp: string
          event_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          sensor_id: string | null
          sensor_type: string | null
          store_id: string | null
          visitor_id: string | null
          zone_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          duration_seconds?: number | null
          event_date: string
          event_hour?: number | null
          event_timestamp: string
          event_type: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          sensor_id?: string | null
          sensor_type?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          duration_seconds?: number | null
          event_date?: string
          event_hour?: number | null
          event_timestamp?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          sensor_id?: string | null
          sensor_type?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_events_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_metrics: {
        Row: {
          conversion_rate: number | null
          created_at: string
          date: string
          dwell_time_avg_min: number | null
          hour: number | null
          id: string
          metadata: Json | null
          org_id: string | null
          revenue: number | null
          store_id: string | null
          visitor_count: number | null
          zone_id: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string
          date: string
          dwell_time_avg_min?: number | null
          hour?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          revenue?: number | null
          store_id?: string | null
          visitor_count?: number | null
          zone_id: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string
          date?: string
          dwell_time_avg_min?: number | null
          hour?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          revenue?: number | null
          store_id?: string | null
          visitor_count?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_metrics_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_zone_fk"
            columns: ["store_id", "zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["store_id", "zone_code"]
          },
        ]
      }
      zone_performance: {
        Row: {
          avg_dwell_time: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          heatmap_data: Json | null
          hourly_visits: Json | null
          id: string
          org_id: string
          purchase_count: number | null
          revenue_contribution: number | null
          store_id: string
          unique_visitors: number | null
          updated_at: string | null
          visit_count: number | null
          zone_name: string
        }
        Insert: {
          avg_dwell_time?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          heatmap_data?: Json | null
          hourly_visits?: Json | null
          id?: string
          org_id: string
          purchase_count?: number | null
          revenue_contribution?: number | null
          store_id: string
          unique_visitors?: number | null
          updated_at?: string | null
          visit_count?: number | null
          zone_name: string
        }
        Update: {
          avg_dwell_time?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          heatmap_data?: Json | null
          hourly_visits?: Json | null
          id?: string
          org_id?: string
          purchase_count?: number | null
          revenue_contribution?: number | null
          store_id?: string
          unique_visitors?: number | null
          updated_at?: string | null
          visit_count?: number | null
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_performance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_transitions: {
        Row: {
          avg_duration_seconds: number | null
          created_at: string | null
          from_zone_id: string
          id: string
          org_id: string | null
          store_id: string
          to_zone_id: string
          transition_count: number | null
          transition_date: string
        }
        Insert: {
          avg_duration_seconds?: number | null
          created_at?: string | null
          from_zone_id: string
          id?: string
          org_id?: string | null
          store_id: string
          to_zone_id: string
          transition_count?: number | null
          transition_date: string
        }
        Update: {
          avg_duration_seconds?: number | null
          created_at?: string | null
          from_zone_id?: string
          id?: string
          org_id?: string | null
          store_id?: string
          to_zone_id?: string
          transition_count?: number | null
          transition_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_zone_transitions_from_zone"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_zone_transitions_from_zone"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_zone_transitions_from_zone"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_zone_transitions_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_zone_transitions_to_zone"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_zone_transitions_to_zone"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_zone_transitions_to_zone"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      zones_dim: {
        Row: {
          area_sqm: number | null
          capacity: number | null
          color: string | null
          coordinates: Json | null
          created_at: string | null
          floor_level: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          org_id: string | null
          parent_zone_id: string | null
          position_x: number | null
          position_y: number | null
          position_z: number | null
          properties: Json | null
          size_depth: number | null
          size_height: number | null
          size_width: number | null
          store_id: string
          updated_at: string | null
          user_id: string | null
          vmd_attributes: Json | null
          zone_code: string
          zone_name: string
          zone_type: string | null
        }
        Insert: {
          area_sqm?: number | null
          capacity?: number | null
          color?: string | null
          coordinates?: Json | null
          created_at?: string | null
          floor_level?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          parent_zone_id?: string | null
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          properties?: Json | null
          size_depth?: number | null
          size_height?: number | null
          size_width?: number | null
          store_id: string
          updated_at?: string | null
          user_id?: string | null
          vmd_attributes?: Json | null
          zone_code: string
          zone_name: string
          zone_type?: string | null
        }
        Update: {
          area_sqm?: number | null
          capacity?: number | null
          color?: string | null
          coordinates?: Json | null
          created_at?: string | null
          floor_level?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          parent_zone_id?: string | null
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          properties?: Json | null
          size_depth?: number | null
          size_height?: number | null
          size_width?: number | null
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
          vmd_attributes?: Json | null
          zone_code?: string
          zone_name?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_dim_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_fk"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_fk"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_fk"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_parse_success_stats: {
        Row: {
          avg_execution_time_ms: number | null
          date: string | null
          fallback_uses: number | null
          function_name: string | null
          success_rate_percent: number | null
          successful_parses: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      v_ai_response_stats: {
        Row: {
          avg_execution_time_ms: number | null
          avg_quality_score: number | null
          error_count: number | null
          first_log_at: string | null
          function_name: string | null
          good_example_count: number | null
          last_log_at: string | null
          rated_count: number | null
          simulation_type: string | null
          total_count: number | null
        }
        Relationships: []
      }
      v_batch_test_failures: {
        Row: {
          combination_id: string | null
          combination_variables: Json | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          function_name: string | null
          test_batch_id: string | null
          test_type: string | null
        }
        Insert: {
          combination_id?: string | null
          combination_variables?: Json | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          test_batch_id?: string | null
          test_type?: string | null
        }
        Update: {
          combination_id?: string | null
          combination_variables?: Json | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          test_batch_id?: string | null
          test_type?: string | null
        }
        Relationships: []
      }
      v_batch_test_linked_analysis: {
        Row: {
          both_success: boolean | null
          created_at: string | null
          issues_passed: string | null
          optimization_combination: string | null
          optimization_quality: number | null
          optimization_success: boolean | null
          optimization_time_ms: number | null
          simulation_combination: string | null
          simulation_quality: number | null
          simulation_success: boolean | null
          simulation_time_ms: number | null
          test_batch_id: string | null
        }
        Relationships: []
      }
      v_batch_test_scenario_stats: {
        Row: {
          avg_quality: number | null
          optimization_type: string | null
          preset_scenario: string | null
          success_count: number | null
          success_rate: number | null
          test_batch_id: string | null
          test_type: string | null
          total_tests: number | null
        }
        Relationships: []
      }
      v_batch_test_summary: {
        Row: {
          avg_quality_score: number | null
          avg_time_ms: number | null
          completed_at: string | null
          failure_count: number | null
          max_time_ms: number | null
          min_time_ms: number | null
          started_at: string | null
          success_count: number | null
          success_rate: number | null
          test_batch_id: string | null
          test_type: string | null
          total_tests: number | null
        }
        Relationships: []
      }
      v_finetuning_dataset: {
        Row: {
          ai_response: Json | null
          context_metadata: Json | null
          created_at: string | null
          execution_time_ms: number | null
          function_name: string | null
          id: string | null
          input_variables: Json | null
          quality_notes: string | null
          quality_score: number | null
          simulation_type: string | null
          store_id: string | null
        }
        Insert: {
          ai_response?: Json | null
          context_metadata?: Json | null
          created_at?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string | null
          input_variables?: Json | null
          quality_notes?: string | null
          quality_score?: number | null
          simulation_type?: string | null
          store_id?: string | null
        }
        Update: {
          ai_response?: Json | null
          context_metadata?: Json | null
          created_at?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string | null
          input_variables?: Json | null
          quality_notes?: string | null
          quality_score?: number | null
          simulation_type?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_response_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_furniture_vmd_summary: {
        Row: {
          accessibility_multiplier: number | null
          accessibility_score: number | null
          facing: string | null
          furniture_name: string | null
          furniture_type: string | null
          height_range_cm: string | null
          height_zone: string | null
          id: string | null
          is_endcap: boolean | null
          is_focal_point: boolean | null
          lighting_enhanced: boolean | null
          max_products: number | null
          store_id: string | null
          traffic_exposure: number | null
          visibility_multiplier: number | null
          visibility_score: number | null
          zone_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "furniture_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "v_zone_vmd_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_orgs: {
        Row: {
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          org_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_vmd_rules_summary: {
        Row: {
          action: string | null
          confidence_level: number | null
          description: string | null
          expected_impact: Json | null
          is_active: boolean | null
          name: string | null
          priority: number | null
          rule_category: string | null
          rule_code: string | null
          times_accepted: number | null
          times_applied: number | null
        }
        Insert: {
          action?: string | null
          confidence_level?: number | null
          description?: string | null
          expected_impact?: Json | null
          is_active?: boolean | null
          name?: string | null
          priority?: number | null
          rule_category?: string | null
          rule_code?: string | null
          times_accepted?: never
          times_applied?: never
        }
        Update: {
          action?: string | null
          confidence_level?: number | null
          description?: string | null
          expected_impact?: Json | null
          is_active?: boolean | null
          name?: string | null
          priority?: number | null
          rule_category?: string | null
          rule_code?: string | null
          times_accepted?: never
          times_applied?: never
        }
        Relationships: []
      }
      v_zone_vmd_summary: {
        Row: {
          color_code: string | null
          dwell_target_seconds: number | null
          fixture_density: number | null
          id: string | null
          is_dead_space: boolean | null
          is_golden_zone: boolean | null
          sightline_score: number | null
          store_id: string | null
          traffic_weight: number | null
          vmd_type_description: string | null
          vmd_zone_type: string | null
          zone_name: string | null
          zone_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_dim_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          area_sqm: number | null
          capacity: number | null
          color: string | null
          created_at: string | null
          depth: number | null
          height: number | null
          id: string | null
          is_active: boolean | null
          name: string | null
          org_id: string | null
          position_x: number | null
          position_y: number | null
          position_z: number | null
          properties: Json | null
          store_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          width: number | null
        }
        Insert: {
          area_sqm?: number | null
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          depth?: number | null
          height?: number | null
          id?: string | null
          is_active?: never
          name?: string | null
          org_id?: string | null
          position_x?: never
          position_y?: never
          position_z?: never
          properties?: Json | null
          store_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
        }
        Update: {
          area_sqm?: number | null
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          depth?: number | null
          height?: number | null
          id?: string | null
          is_active?: never
          name?: string | null
          org_id?: string | null
          position_x?: never
          position_y?: never
          position_z?: never
          properties?: Json | null
          store_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_dim_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_ai_performance: {
        Args: {
          p_end_date?: string
          p_model_type?: string
          p_org_id: string
          p_start_date?: string
          p_store_id?: string
        }
        Returns: Json
      }
      calculate_confidence_adjustment: {
        Args: { p_days?: number; p_store_id: string; p_strategy_type: string }
        Returns: Json
      }
      calculate_data_quality_score: {
        Args: { p_date?: string; p_store_id: string }
        Returns: Json
      }
      calculate_furniture_visibility: {
        Args: {
          p_facing: string
          p_height_zone: string
          p_is_focal_point?: boolean
          p_lighting_enhanced?: boolean
        }
        Returns: number
      }
      calculate_next_sync_time: {
        Args: {
          p_last_sync?: string
          p_sync_cron?: string
          p_sync_frequency: string
        }
        Returns: string
      }
      can_access_membership: {
        Args: { membership_org_id: string; membership_user_id: string }
        Returns: boolean
      }
      check_slot_display_compatibility: {
        Args: { p_product_id: string; p_slot_id: string }
        Returns: boolean
      }
      check_slot_product_compatibility: {
        Args: { p_product_display_type: string; p_slot_id: string }
        Returns: boolean
      }
      cleanup_old_ai_response_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_batch_test_results: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      compute_all_retail_concepts: {
        Args: { p_days?: number; p_store_id: string }
        Returns: Json
      }
      compute_cross_sell_affinity: {
        Args: { p_min_support?: number; p_store_id: string }
        Returns: {
          co_purchase_count: number
          product_a: string
          product_b: string
          support: number
        }[]
      }
      compute_inventory_turnover: {
        Args: { p_days?: number; p_store_id: string }
        Returns: {
          avg_stock: number
          days_of_stock: number
          product_name: string
          total_sold: number
          turnover_rate: number
        }[]
      }
      compute_zone_conversion_funnel: {
        Args: { p_days?: number; p_store_id: string }
        Returns: {
          avg_dwell: number
          conversion_rate: number
          purchases: number
          visitors: number
          zone_name: string
        }[]
      }
      compute_zone_heatmap: {
        Args: { p_days?: number; p_store_id: string }
        Returns: {
          avg_dwell: number
          hour: number
          visit_count: number
          zone_name: string
        }[]
      }
      create_api_connection: {
        Args: {
          p_auth_config?: Json
          p_auth_type: string
          p_data_category: string
          p_field_mappings?: Json
          p_name: string
          p_org_id: string
          p_provider: string
          p_response_data_path?: string
          p_store_id: string
          p_target_table?: string
          p_url: string
        }
        Returns: Json
      }
      create_import_session: {
        Args: {
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_file_type: string
          p_import_type: string
          p_org_id: string
          p_store_id: string
          p_user_id: string
        }
        Returns: string
      }
      create_sync_log: {
        Args: {
          p_connection_id: string
          p_request_headers?: Json
          p_request_url?: string
          p_sync_type?: string
        }
        Returns: Json
      }
      ensure_store_persona: { Args: { p_store_id: string }; Returns: string }
      ensure_system_context_connections: {
        Args: { p_org_id: string; p_store_id?: string; p_user_id?: string }
        Returns: Json
      }
      execute_api_sync: { Args: { p_connection_id: string }; Returns: Json }
      export_public_schema: { Args: never; Returns: Json }
      generate_sample_sales_data: {
        Args: { p_days?: number; p_org_id: string; p_store_id: string }
        Returns: undefined
      }
      generate_sample_visit_data: {
        Args: {
          p_days?: number
          p_org_id: string
          p_store_id: string
          p_visits_per_day?: number
        }
        Returns: undefined
      }
      get_active_import_sessions: {
        Args: { p_store_id?: string; p_user_id: string }
        Returns: {
          created_at: string
          file_name: string
          id: string
          import_type: string
          row_count: number
          status: string
          target_table: string
          updated_at: string
        }[]
      }
      get_all_data_sources: {
        Args: { p_org_id: string; p_store_id?: string }
        Returns: Json
      }
      get_api_connections_dashboard: {
        Args: { p_org_id?: string; p_store_id?: string }
        Returns: Json
      }
      get_api_mapping_template: {
        Args: { p_data_category?: string; p_provider: string }
        Returns: Json
      }
      get_applicable_vmd_rules: {
        Args: {
          p_category?: string
          p_limit?: number
          p_min_confidence?: number
          p_zone_type?: string
        }
        Returns: {
          confidence_level: number
          description_ko: string
          expected_impact: Json
          priority: number
          recommended_action_ko: string
          rule_category: string
          rule_code: string
          rule_name: string
          rule_name_ko: string
        }[]
      }
      get_applied_strategies: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_store_id: string
        }
        Returns: {
          actual_revenue: number
          created_at: string
          current_roi: number
          end_date: string
          expected_revenue: number
          expected_roi: number
          final_roi: number
          id: string
          name: string
          result: string
          source: string
          source_module: string
          start_date: string
          status: string
        }[]
      }
      get_association_summary: { Args: { p_store_id: string }; Returns: Json }
      get_available_slots_for_display_type: {
        Args: { p_display_type: string; p_store_id: string }
        Returns: {
          furniture_id: string
          furniture_type: string
          slot_code: string
          slot_id: string
          slot_position: Json
          slot_type: string
        }[]
      }
      get_cached_concept_value: {
        Args: { p_concept_name: string; p_store_id: string }
        Returns: Json
      }
      get_category_affinities: {
        Args: { p_limit?: number; p_store_id: string }
        Returns: Json
      }
      get_compatible_slots_for_product: {
        Args: { p_product_id: string; p_store_id: string }
        Returns: {
          compatible_display_types: string[]
          furniture_id: string
          furniture_type: string
          slot_code: string
          slot_position: Json
          slot_type: string
          slot_uuid: string
        }[]
      }
      get_connection_settings: {
        Args: { p_connection_id: string }
        Returns: Json
      }
      get_connections_due_for_sync: {
        Args: { p_limit?: number }
        Returns: {
          auth_config: Json
          auth_type: string
          field_mappings: Json
          id: string
          last_sync: string
          max_retries: number
          name: string
          next_scheduled_sync: string
          response_data_path: string
          retry_count: number
          sync_cron: string
          sync_frequency: string
          target_table: string
          url: string
        }[]
      }
      get_context_data_sources: {
        Args: { p_org_id: string; p_store_id?: string }
        Returns: Json
      }
      get_customer_segments: {
        Args: {
          p_end_date: string
          p_org_id: string
          p_start_date: string
          p_store_id: string
        }
        Returns: {
          avg_transaction_value: number
          customer_count: number
          segment_name: string
          visit_frequency: number
        }[]
      }
      get_daily_kpis_summary: {
        Args: { p_days?: number; p_store_id: string }
        Returns: {
          avg_transaction_value: number
          conversion_rate: number
          date: string
          sales_per_sqm: number
          total_revenue: number
          total_transactions: number
          total_visitors: number
        }[]
      }
      get_data_control_tower_status: {
        Args: { p_limit?: number; p_store_id: string }
        Returns: Json
      }
      get_failure_patterns: {
        Args: { p_limit?: number; p_store_id: string; p_strategy_type: string }
        Returns: Json
      }
      get_funnel_stats: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: {
          event_type: string
          unique_visitors: number
        }[]
      }
      get_hourly_entry_counts: {
        Args: {
          p_end_date: string
          p_org_id: string
          p_start_date: string
          p_store_id: string
        }
        Returns: {
          count: number
          hour: number
        }[]
      }
      get_hourly_traffic: {
        Args: { p_date?: string; p_store_id: string }
        Returns: {
          conversion_rate: number
          hour: number
          revenue: number
          transaction_count: number
          visitor_count: number
        }[]
      }
      get_import_schema: {
        Args: { p_import_type: string }
        Returns: {
          import_type: string
          optional_fields: Json
          required_fields: Json
          sample_data: Json
          target_table: string
          validation_rules: Json
        }[]
      }
      get_import_target_table: {
        Args: { p_import_type: string }
        Returns: string
      }
      get_inventory_movements: {
        Args: {
          p_end_date: string
          p_limit?: number
          p_org_id: string
          p_start_date: string
        }
        Returns: {
          id: string
          moved_at: string
          movement_type: string
          new_stock: number
          previous_stock: number
          product_id: string
          product_name: string
          quantity: number
          reason: string
        }[]
      }
      get_inventory_status: {
        Args: { p_org_id: string }
        Returns: {
          category: string
          current_stock: number
          days_until_stockout: number
          minimum_stock: number
          optimal_stock: number
          price: number
          product_id: string
          product_name: string
          sku: string
          stock_status: string
          weekly_demand: number
        }[]
      }
      get_kpi_lineage: {
        Args: {
          p_date?: string
          p_kpi_id?: string
          p_kpi_table: string
          p_store_id?: string
        }
        Returns: Json
      }
      get_overview_kpis: {
        Args: {
          p_end_date: string
          p_org_id: string
          p_start_date: string
          p_store_id: string
        }
        Returns: {
          avg_conversion_rate: number
          avg_dwell_minutes: number
          avg_transaction_value: number
          funnel_browse: number
          funnel_engage: number
          funnel_entry: number
          funnel_fitting: number
          funnel_purchase: number
          returning_visitors: number
          total_revenue: number
          total_transactions: number
          total_visitors: number
          unique_visitors: number
        }[]
      }
      get_product_associations: {
        Args: {
          p_limit?: number
          p_min_confidence?: number
          p_min_lift?: number
          p_product_id?: string
          p_store_id: string
        }
        Returns: Json
      }
      get_product_performance: {
        Args: {
          p_end_date: string
          p_org_id: string
          p_start_date: string
          p_store_id: string
        }
        Returns: {
          category: string
          product_id: string
          product_name: string
          revenue: number
          stock_level: number
          units_sold: number
        }[]
      }
      get_roi_by_category: {
        Args: { p_org_id: string; p_store_id?: string }
        Returns: {
          avg_roi: number
          source: string
          source_module: string
          success_count: number
          total_count: number
          total_effect: number
        }[]
      }
      get_roi_summary: {
        Args: { p_org_id: string; p_store_id?: string }
        Returns: {
          active_strategies: number
          avg_roi: number
          completed_strategies: number
          success_count: number
          success_rate: number
          total_actual_revenue: number
          total_expected_revenue: number
          total_strategies: number
        }[]
      }
      get_schema_metadata: { Args: never; Returns: Json }
      get_store_goals: {
        Args: { p_date?: string; p_org_id: string; p_store_id: string }
        Returns: {
          goal_type: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          target_value: number
        }[]
      }
      get_store_persona_context: { Args: { p_store_id: string }; Returns: Json }
      get_strategy_roi_trend: {
        Args: { p_strategy_id: string }
        Returns: {
          cumulative_roi: number
          daily_roi: number
          date: string
          metrics: Json
        }[]
      }
      get_success_patterns: {
        Args: { p_limit?: number; p_store_id: string; p_strategy_type: string }
        Returns: Json
      }
      get_sync_history: {
        Args: {
          p_connection_id?: string
          p_limit?: number
          p_offset?: number
          p_org_id?: string
        }
        Returns: Json
      }
      get_sync_statistics: {
        Args: { p_connection_id?: string; p_days?: number; p_org_id?: string }
        Returns: Json
      }
      get_sync_status: {
        Args: { p_org_id?: string; p_store_id?: string }
        Returns: Json
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_orgs: {
        Args: { _user_id: string }
        Returns: {
          org_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_visit_statistics: {
        Args: { p_days?: number; p_store_id: string }
        Returns: {
          avg_duration_minutes: number
          avg_purchase_amount: number
          conversion_rate: number
          date: string
          purchase_count: number
          total_visits: number
        }[]
      }
      get_zone_metrics: {
        Args: {
          p_end_date: string
          p_org_id: string
          p_start_date: string
          p_store_id: string
        }
        Returns: {
          avg_dwell_seconds: number
          conversion_count: number
          revenue: number
          visitors: number
          zone_id: string
          zone_name: string
          zone_type: string
        }[]
      }
      get_zones_dim_list: {
        Args: { p_org_id: string; p_store_id: string }
        Returns: {
          id: string
          is_active: boolean
          zone_name: string
          zone_type: string
        }[]
      }
      graph_n_hop_query: {
        Args: {
          p_max_hops?: number
          p_start_entity_id: string
          p_user_id: string
        }
        Returns: Json
      }
      graph_shortest_path: {
        Args: { p_end_id: string; p_start_id: string; p_user_id: string }
        Returns: Json
      }
      handover_chat_session: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: number
      }
      has_valid_license: {
        Args: { _license_type: string; _user_id: string }
        Returns: boolean
      }
      is_neuraltwin_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_admin_simple: { Args: { check_org_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member_simple: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member_with_license: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      migrate_user_to_organization: {
        Args: { p_user_id: string }
        Returns: string
      }
      record_sync_result: {
        Args: {
          p_batch_id: string
          p_connection_id: string
          p_duration_ms?: number
          p_error_details?: Json
          p_error_message?: string
          p_records_created?: number
          p_records_failed?: number
          p_records_fetched?: number
          p_records_updated?: number
          p_status: string
        }
        Returns: Json
      }
      save_concept_value: {
        Args: {
          p_concept_name: string
          p_parameters?: Json
          p_store_id: string
          p_valid_hours?: number
          p_value: Json
        }
        Returns: string
      }
      search_knowledge: {
        Args: {
          filter_topic?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_type: string
          conditions: Json
          content: string
          id: string
          similarity: number
          title: string
          topic_id: string
        }[]
      }
      search_knowledge_trgm: {
        Args: {
          filter_topic?: string
          match_count?: number
          match_threshold?: number
          search_query: string
        }
        Returns: {
          chunk_type: string
          conditions: Json
          content: string
          id: string
          similarity: number
          title: string
          topic_id: string
        }[]
      }
      test_api_connection: { Args: { p_connection_id: string }; Returns: Json }
      update_connection_after_sync: {
        Args: {
          p_connection_id: string
          p_duration_ms?: number
          p_error_message?: string
          p_records_synced?: number
          p_success: boolean
        }
        Returns: Json
      }
      update_connection_settings: {
        Args: {
          p_auth_config?: Json
          p_auth_type?: string
          p_connection_id: string
          p_description?: string
          p_field_mappings?: Json
          p_headers?: Json
          p_is_active?: boolean
          p_max_retries?: number
          p_method?: string
          p_name?: string
          p_response_data_path?: string
          p_sync_config?: Json
          p_sync_cron?: string
          p_sync_frequency?: string
          p_target_table?: string
          p_url?: string
        }
        Returns: Json
      }
      update_import_session_status: {
        Args: {
          p_column_mapping?: Json
          p_parsed_preview?: Json
          p_row_count?: number
          p_session_id: string
          p_status: string
          p_validation_errors?: Json
        }
        Returns: boolean
      }
      update_sync_log: {
        Args: {
          p_duration_ms?: number
          p_error_details?: Json
          p_error_message?: string
          p_error_type?: string
          p_etl_run_id?: string
          p_log_id: string
          p_raw_import_id?: string
          p_records_created?: number
          p_records_failed?: number
          p_records_fetched?: number
          p_records_updated?: number
          p_response_size_bytes?: number
          p_response_status?: number
          p_status: string
        }
        Returns: Json
      }
      user_can_access_store: { Args: { p_store_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "ORG_OWNER"
        | "ORG_ADMIN"
        | "ORG_MEMBER"
        | "NEURALTWIN_ADMIN"
        | "NEURALTWIN_MASTER"
        | "ORG_HQ"
        | "ORG_STORE"
        | "ORG_VIEWER"
      chat_channel: "website" | "os_app"
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
      app_role: [
        "ORG_OWNER",
        "ORG_ADMIN",
        "ORG_MEMBER",
        "NEURALTWIN_ADMIN",
        "NEURALTWIN_MASTER",
        "ORG_HQ",
        "ORG_STORE",
        "ORG_VIEWER",
      ],
      chat_channel: ["website", "os_app"],
    },
  },
} as const

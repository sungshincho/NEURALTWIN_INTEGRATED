# Table Usage Map

> Auto-generated during Phase 4 Step 4. Updated: 2026-02-25

## Summary

| Metric | Count |
|--------|-------|
| Total tables in schema | ~153 |
| Used in Website | 6 |
| Used in OS Dashboard | ~85 |
| Used in Edge Functions | ~78 |
| Active (≥1 reference) | ~109 |
| Unused | ~44 |

---

## Website Tables (6)

The website is minimal — auth and profile only.

| Table | Files |
|-------|-------|
| avatars | Profile.tsx |
| licenses | Profile.tsx |
| organization_members | useAuth.ts, Auth.tsx, Dashboard.tsx, Profile.tsx, Subscribe.tsx |
| organizations | Auth.tsx |
| profiles | Header.tsx, Profile.tsx |
| subscriptions | Auth.tsx, Dashboard.tsx, Profile.tsx |

---

## OS Dashboard — Key Table Groups

### Core Retail Entities
products, stores, customers, purchases, inventory_levels, staff, zones_dim, daily_kpis_agg

### AI & Analytics
ai_inference_results, ai_recommendations, ai_response_logs, ai_insights, dashboard_kpis, daily_kpis_agg, zone_daily_metrics, hourly_metrics

### Ontology
graph_entities, graph_relations, ontology_entity_types, ontology_entity_mappings, ontology_relation_types, ontology_relation_mappings, ontology_mapping_cache, ontology_schema_versions

### Data Management
raw_imports, user_data_imports, etl_runs, upload_sessions, data_sources, data_source_tables, data_sync_logs, api_connections

### Simulation & Optimization
applied_strategies, layout_optimization_results, store_scenes, simulation_history, stored_model_parameters, optimization_tasks, optimization_feedback

### 3D Models
model_3d_files, product_models, product_placements, furniture, furniture_slots

### Chat
chat_conversations, chat_messages, chat_events, chat_leads, chat_context_memory

---

## Cross-Layer Tables (used across all 3)

These tables are referenced from website, OS dashboard, AND edge functions:

- **organization_members** — auth backbone
- **graph_entities / graph_relations** — ontology core
- **daily_kpis_agg / zone_daily_metrics** — analytics
- **products / stores / customers** — core retail entities

---

## Most Referenced Tables (Top 10)

1. **graph_entities** — 12+ references (ontology hub)
2. **daily_kpis_agg** — 10+ references (analytics core)
3. **products** — 9+ references
4. **stores** — 8+ references
5. **zone_daily_metrics** — 7+ references
6. **raw_imports** — 7+ references
7. **data_sources** — 6+ references
8. **graph_relations** — 6+ references
9. **ai_inference_results** — 5+ references
10. **inventory_levels** — 5+ references

---

## Unused Tables (~44) — Candidates for Archival

### Test/Diagnostic (5)
ai_batch_test_results, ai_inference_logs, ai_model_performance, ai_scene_analysis, column_mappings

### Deprecated/Replaced (10)
| Unused Table | Likely Replacement |
|-------------|-------------------|
| alerts | user_alerts |
| inventory | inventory_levels |
| daily_sales | dashboard_kpis |
| zone_metrics | zone_daily_metrics |
| customer_segments | customer_segments_agg |
| models | model_3d_files |
| ontology_schemas | ontology_schema_versions |
| sync_endpoints | data_sources / api_connections |
| kpis | dashboard_kpis |
| retail_concept_values | retail_concepts |

### Unimplemented Features (19)
beacon_events, beacons, camera_events, furniture_facings, furniture_height_zones,
shift_schedules, hq_guidelines, hq_notifications, hq_store_messages,
push_subscriptions, assistant_command_cache, chat_daily_analytics,
strategy_daily_metrics, zone_performance, web_events, wifi_events,
prediction_records, learning_adjustments, learning_sessions

### Partial/Legacy (8)
tasks, report_schedules, scenarios, simulation_configs, store_comments,
license_billing_history, import_type_schemas, field_transform_rules

### System Views (2)
v_org_id, visit_zone_events

---

## Architectural Patterns

1. **Layered usage** — Website (auth only) → OS Dashboard (full features) → EFs (heavy ETL/processing)
2. **Data flow hubs** — unified-etl processes 20+ tables, generate-optimization uses 15+
3. **Ontology-centric** — graph_entities + graph_relations form the semantic backbone
4. **Deprecation pattern** — Generic → Aggregated (e.g., alerts → user_alerts)

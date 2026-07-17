---
name: springhub-mcp
description: Use when managing Supabase database, running SQL queries, or configuring MCP for the SpringHub project. Not for general coding tasks.
---

# SpringHub MCP Management

## Supabase MCP Server
- Server: `@supabase/mcp-server-supabase`
- Config: `.opencode/opencode.json` -> `mcp.supabase`
- Commands: manage schemas, run migrations, execute SQL queries, check project status

## Filesystem MCP Server
- Server: `@modelcontextprotocol/server-filesystem`
- Path scope: project root directory only
- Config: `.opencode/opencode.json` -> `mcp.filesystem`

## Common Supabase Tasks

### Initialize Schema
Run the database migrations to create all SpringHub tables (profiles, reports, donations, projects, points_log) with proper RLS policies.

### Add RLS Policy
Create row-level security policies per role (public, volunteer, field_lead, admin) for each table.

### Run Query
Execute SQL queries against the Supabase project database.

See AGENTS.md for full database schema and RLS policy definitions.

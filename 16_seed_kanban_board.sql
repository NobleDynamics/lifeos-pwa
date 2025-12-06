-- =============================================================================
-- Kanban Board User App Seed Data
-- Run this in Supabase SQL Editor to create a new "Project Board" user app
-- =============================================================================

-- Use the test user ID from dev environment
DO $$
DECLARE
  test_user_id UUID := '11111111-1111-1111-1111-111111111111';
  
  -- Root IDs
  context_root_id UUID;
  app_shell_id UUID;
  
  -- Column IDs
  col_todo_id UUID;
  col_progress_id UUID;
  col_review_id UUID;
  col_done_id UUID;
  
  -- Card IDs
  card_1_id UUID;
  card_2_id UUID;
  card_3_id UUID;
  card_4_id UUID;
  card_5_id UUID;
  card_6_id UUID;
  
BEGIN
  -- Generate UUIDs
  context_root_id := gen_random_uuid();
  app_shell_id := gen_random_uuid();
  col_todo_id := gen_random_uuid();
  col_progress_id := gen_random_uuid();
  col_review_id := gen_random_uuid();
  col_done_id := gen_random_uuid();
  card_1_id := gen_random_uuid();
  card_2_id := gen_random_uuid();
  card_3_id := gen_random_uuid();
  card_4_id := gen_random_uuid();
  card_5_id := gen_random_uuid();
  card_6_id := gen_random_uuid();

  -- =============================================================================
  -- 1. Context Root (Required for User Apps)
  -- =============================================================================
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    context_root_id,
    test_user_id,
    'context_root',
    'Projects',
    NULL,
    'root.' || REPLACE(context_root_id::text, '-', '_'),
    jsonb_build_object(
      'context_key', 'user.projects',
      'is_context_root', true,
      'icon', 'Layout'
    )
  );

  -- =============================================================================
  -- 2. App Shell (layout_app_shell) 
  -- =============================================================================
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    app_shell_id,
    test_user_id,
    'folder',
    'Project Board',
    context_root_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'view_board_columns',
      'is_system_app', true,
      'icon', 'Kanban',
      'presentation_mode', 'immersive',
      'description', 'Kanban-style project management board'
    )
  );

  -- =============================================================================
  -- 3. Columns (view_list_stack with column_color)
  -- =============================================================================
  
  -- Column: To Do (Red)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    col_todo_id,
    test_user_id,
    'folder',
    'To Do',
    app_shell_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_todo_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'view_list_stack',
      'column_color', '#ef4444',
      'icon', 'Circle'
    )
  );

  -- Column: In Progress (Yellow)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    col_progress_id,
    test_user_id,
    'folder',
    'In Progress',
    app_shell_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_progress_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'view_list_stack',
      'column_color', '#fbbf24',
      'icon', 'Clock'
    )
  );

  -- Column: Review (Purple)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    col_review_id,
    test_user_id,
    'folder',
    'Review',
    app_shell_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_review_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'view_list_stack',
      'column_color', '#a855f7',
      'icon', 'Eye'
    )
  );

  -- Column: Done (Green)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    col_done_id,
    test_user_id,
    'folder',
    'Done',
    app_shell_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_done_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'view_list_stack',
      'column_color', '#22c55e',
      'icon', 'CheckCircle'
    )
  );

  -- =============================================================================
  -- 4. Cards (card_kanban_details and card_kanban_image)
  -- =============================================================================

  -- Card 1: Design landing page (To Do - High Priority)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    card_1_id,
    test_user_id,
    'task',
    'Design landing page',
    col_todo_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_todo_id::text, '-', '_') || '.' || REPLACE(card_1_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'card_kanban_details',
      'subtext', 'Create mockups in Figma for the new marketing site',
      'due_date', (CURRENT_DATE + INTERVAL '3 days')::text,
      'priority_color', '#ef4444',
      'assignee', 'JD',
      'tags', ARRAY['design', 'urgent', 'q1']
    )
  );

  -- Card 2: API Integration (To Do - Medium Priority)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    card_2_id,
    test_user_id,
    'task',
    'API Integration',
    col_todo_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_todo_id::text, '-', '_') || '.' || REPLACE(card_2_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'card_kanban_details',
      'subtext', 'Connect to payment gateway and sync user data',
      'due_date', (CURRENT_DATE + INTERVAL '7 days')::text,
      'priority_color', '#fbbf24',
      'tags', ARRAY['backend', 'api']
    )
  );

  -- Card 3: Hero Banner (In Progress - with image)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    card_3_id,
    test_user_id,
    'task',
    'Hero Banner Design',
    col_progress_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_progress_id::text, '-', '_') || '.' || REPLACE(card_3_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'card_kanban_image',
      'subtext', 'Finalizing the color scheme and typography',
      'media', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=200&fit=crop',
      'media_height', 'h-24',
      'due_date', (CURRENT_DATE + INTERVAL '1 day')::text,
      'assignee', 'SM',
      'tags', ARRAY['design']
    )
  );

  -- Card 4: Database Schema (In Progress)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    card_4_id,
    test_user_id,
    'task',
    'Database Schema Update',
    col_progress_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_progress_id::text, '-', '_') || '.' || REPLACE(card_4_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'card_kanban_details',
      'subtext', 'Adding ltree paths and fixing RLS policies',
      'due_date', CURRENT_DATE::text,
      'priority_color', '#22c55e',
      'assignee', 'MK'
    )
  );

  -- Card 5: Code Review (Review)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    card_5_id,
    test_user_id,
    'task',
    'PR #142: Auth Flow',
    col_review_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_review_id::text, '-', '_') || '.' || REPLACE(card_5_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'card_kanban_details',
      'subtext', 'Review the new authentication flow implementation',
      'assignee', 'JD',
      'tags', ARRAY['review', 'security']
    )
  );

  -- Card 6: Setup CI/CD (Done)
  INSERT INTO resources (id, user_id, type, title, parent_id, path, meta_data)
  VALUES (
    card_6_id,
    test_user_id,
    'task',
    'Setup CI/CD Pipeline',
    col_done_id,
    'root.' || REPLACE(context_root_id::text, '-', '_') || '.' || REPLACE(app_shell_id::text, '-', '_') || '.' || REPLACE(col_done_id::text, '-', '_') || '.' || REPLACE(card_6_id::text, '-', '_'),
    jsonb_build_object(
      'variant', 'card_kanban_details',
      'subtext', 'GitHub Actions workflow for automated deployments',
      'tags', ARRAY['devops', 'done']
    )
  );

  RAISE NOTICE 'Kanban Board created successfully!';
  RAISE NOTICE 'Context Root ID: %', context_root_id;
  RAISE NOTICE 'App Shell ID: %', app_shell_id;
  RAISE NOTICE '';
  RAISE NOTICE 'The "Project Board" app should now appear in the app drawer.';
  RAISE NOTICE 'It will show 4 columns: To Do, In Progress, Review, Done';

END $$;

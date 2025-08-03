-- Create user_workflow records for existing projects
INSERT INTO user_workflows (id, user_id, workflow_data)
SELECT 
  p.id,
  p.user_id,
  jsonb_build_object(
    'project_id', p.id,
    'title', p.title,
    'paper_type', p.paper_type,
    'theme', p.theme,
    'steps_completed', '[]'::jsonb,
    'progress', 0,
    'created_at', p.created_at
  )
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM user_workflows uw WHERE uw.id = p.id
);
-- Insert default feedback categories that organizations can use
-- This will be handled by the application, but we can create a function for it

CREATE OR REPLACE FUNCTION public.create_default_categories(org_id UUID, creator_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.feedback_categories (organization_id, name, description, color, created_by) VALUES
    (org_id, 'Bug Report', 'Issues and bugs found in the system', '#EF4444', creator_id),
    (org_id, 'Feature Request', 'New features and enhancements', '#3B82F6', creator_id),
    (org_id, 'Improvement', 'Suggestions for improving existing features', '#10B981', creator_id),
    (org_id, 'General Feedback', 'General comments and suggestions', '#8B5CF6', creator_id),
    (org_id, 'Support', 'Help and support requests', '#F59E0B', creator_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION public.get_organization_stats(org_id UUID)
RETURNS TABLE (
  total_feedback INTEGER,
  open_feedback INTEGER,
  resolved_feedback INTEGER,
  total_members INTEGER,
  total_teams INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.feedback WHERE organization_id = org_id),
    (SELECT COUNT(*)::INTEGER FROM public.feedback WHERE organization_id = org_id AND status = 'open'),
    (SELECT COUNT(*)::INTEGER FROM public.feedback WHERE organization_id = org_id AND status = 'resolved'),
    (SELECT COUNT(*)::INTEGER FROM public.organization_members WHERE organization_id = org_id),
    (SELECT COUNT(*)::INTEGER FROM public.teams WHERE organization_id = org_id);
END;
$$;

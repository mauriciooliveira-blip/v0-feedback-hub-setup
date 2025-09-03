-- Analytics events table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table for saved reports and dashboards
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('feedback_summary', 'team_performance', 'category_analysis', 'custom')),
  config JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "analytics_select_org_admins" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = analytics_events.organization_id AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "analytics_insert_org_members" ON public.analytics_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = analytics_events.organization_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for reports
CREATE POLICY "reports_select_org_members" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = reports.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "reports_insert_managers" ON public.reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = reports.organization_id AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    ) AND auth.uid() = created_by
  );

-- Add updated_at trigger for reports
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_organization_id ON public.feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON public.feedback(assigned_to);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization_id ON public.analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

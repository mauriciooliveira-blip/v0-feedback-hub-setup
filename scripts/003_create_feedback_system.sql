-- Feedback categories table
CREATE TABLE IF NOT EXISTS public.feedback_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.feedback_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'complaint', 'suggestion', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')) DEFAULT 'open',
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback comments table
CREATE TABLE IF NOT EXISTS public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback attachments table
CREATE TABLE IF NOT EXISTS public.feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback votes table (for prioritization)
CREATE TABLE IF NOT EXISTS public.feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feedback_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_categories
CREATE POLICY "categories_select_org_members" ON public.feedback_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = feedback_categories.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "categories_insert_managers" ON public.feedback_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = feedback_categories.organization_id AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS Policies for feedback
CREATE POLICY "feedback_select_org_members" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = feedback.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_insert_org_members" ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = feedback.organization_id AND user_id = auth.uid()
    ) AND auth.uid() = submitted_by
  );

CREATE POLICY "feedback_update_assigned_or_managers" ON public.feedback
  FOR UPDATE USING (
    auth.uid() = assigned_to OR 
    auth.uid() = submitted_by OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = feedback.organization_id AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS Policies for feedback_comments
CREATE POLICY "comments_select_org_members" ON public.feedback_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.feedback f
      JOIN public.organization_members om ON f.organization_id = om.organization_id
      WHERE f.id = feedback_comments.feedback_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "comments_insert_org_members" ON public.feedback_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feedback f
      JOIN public.organization_members om ON f.organization_id = om.organization_id
      WHERE f.id = feedback_comments.feedback_id AND om.user_id = auth.uid()
    ) AND auth.uid() = user_id
  );

-- Add updated_at triggers
CREATE TRIGGER update_feedback_categories_updated_at
  BEFORE UPDATE ON public.feedback_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_comments_updated_at
  BEFORE UPDATE ON public.feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

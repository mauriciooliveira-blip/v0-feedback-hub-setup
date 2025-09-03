-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "organizations_select_members" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_own" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "organizations_update_admins" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for teams
CREATE POLICY "teams_select_members" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = teams.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "teams_insert_managers" ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = teams.organization_id AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "org_members_select_own_org" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om 
      WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_insert_admins" ON public.organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organization_members.organization_id AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for team_members
CREATE POLICY "team_members_select_org_members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE t.id = team_members.team_id AND om.user_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

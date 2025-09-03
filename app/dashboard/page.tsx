import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateOrganizationDialog } from "@/components/create-organization-dialog"
import { OrganizationCard } from "@/components/organization-card"
import { Building2, Users, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's organizations (limit to 3 for dashboard)
  const { data: organizations } = await supabase
    .from("organization_members")
    .select(`
      role,
      organizations (
        id,
        name,
        description,
        industry,
        size_category,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .limit(3)

  // Get stats
  const { data: totalOrgs } = await supabase
    .from("organization_members")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  const orgData = await Promise.all(
    (organizations || []).map(async (orgMember) => {
      const org = orgMember.organizations
      if (!org) return null

      const [memberCount, teamCount] = await Promise.all([
        supabase.from("organization_members").select("id", { count: "exact" }).eq("organization_id", org.id),
        supabase.from("teams").select("id", { count: "exact" }).eq("organization_id", org.id),
      ])

      return {
        ...org,
        role: orgMember.role,
        member_count: memberCount.count || 0,
        team_count: teamCount.count || 0,
      }
    }),
  )

  const validOrganizations = orgData.filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FeedbackHub Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">Olá, {profile?.first_name || user.email}</span>
            <form action={handleSignOut}>
              <Button variant="outline" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizações</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrgs?.count || 0}</div>
              <p className="text-xs text-muted-foreground">Organizações que você participa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {validOrganizations.reduce((acc, org) => acc + (org?.team_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total de equipes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Feedback coletado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Aberto</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aguardando resolução</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Minhas Organizações</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/organizations">Ver Todas</Link>
              </Button>
            </div>

            {validOrganizations.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Bem-vindo ao FeedbackHub!</CardTitle>
                  <CardDescription>Sua plataforma de gestão de feedback está pronta</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure sua organização e comece a coletar feedback da sua equipe.
                  </p>
                  <CreateOrganizationDialog
                    userId={user.id}
                    trigger={
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Organização
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {validOrganizations.map((org) => (
                  <OrganizationCard key={org.id} organization={org} />
                ))}
                {validOrganizations.length >= 3 && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-6">
                      <Button asChild variant="ghost">
                        <Link href="/organizations">Ver todas as organizações</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Atividade Recente</h2>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Recente</CardTitle>
                <CardDescription>Últimos feedbacks recebidos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nenhum feedback ainda. Comece criando sua primeira organização.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CreateOrganizationDialog
                  userId={user.id}
                  trigger={
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Nova Organização
                    </Button>
                  }
                />
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/organizations">
                    <Building2 className="h-4 w-4 mr-2" />
                    Gerenciar Organizações
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

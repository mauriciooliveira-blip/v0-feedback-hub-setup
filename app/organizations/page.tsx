import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateOrganizationDialog } from "@/components/create-organization-dialog"
import { OrganizationCard } from "@/components/organization-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function OrganizationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's organizations
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

  // Get member and team counts for each organization
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Organizações</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Gerencie suas organizações e equipes</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
            <CreateOrganizationDialog
              userId={user.id}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Organização
                </Button>
              }
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {validOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma organização encontrada</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Crie sua primeira organização para começar a coletar e gerenciar feedback.
              </p>
              <CreateOrganizationDialog
                userId={user.id}
                trigger={
                  <Button size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Organização
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validOrganizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

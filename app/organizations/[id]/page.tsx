import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Plus, ArrowLeft, MessageSquare, BarChart3 } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrganizationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is member of this organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", id)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Get organization details
  const { data: organization } = await supabase.from("organizations").select("*").eq("id", id).single()

  if (!organization) {
    notFound()
  }

  // Get organization members
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      role,
      joined_at,
      profiles (
        first_name,
        last_name,
        email
      )
    `)
    .eq("organization_id", id)

  // Get organization teams
  const { data: teams } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      description,
      created_at,
      created_by,
      profiles!teams_created_by_fkey (
        first_name,
        last_name
      )
    `)
    .eq("organization_id", id)

  const roleLabels = {
    owner: "Proprietário",
    admin: "Administrador",
    manager: "Gerente",
    member: "Membro",
  }

  const canManage = ["owner", "admin", "manager"].includes(membership.role)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/organizations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{organization.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">{organization.description}</p>
              </div>
            </div>
            <Badge variant="secondary">{roleLabels[membership.role as keyof typeof roleLabels]}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="teams">Equipes</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            {canManage && <TabsTrigger value="settings">Configurações</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{members?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Equipes Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teams?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Feedback Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Feedback Aberto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Equipes Recentes</CardTitle>
                  <CardDescription>Últimas equipes criadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {teams && teams.length > 0 ? (
                    <div className="space-y-3">
                      {teams.slice(0, 3).map((team) => (
                        <div key={team.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Criado por {team.profiles?.first_name} {team.profiles?.last_name}
                            </p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/teams/${team.id}`}>Ver</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma equipe criada ainda.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href={`/organizations/${id}/feedback`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ver Todo Feedback
                    </Link>
                  </Button>
                  {canManage && (
                    <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                      <Link href={`/organizations/${id}/analytics`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver Analytics
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href={`/organizations/${id}/teams`}>
                      <Users className="h-4 w-4 mr-2" />
                      Gerenciar Equipes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Equipes</h2>
                <p className="text-muted-foreground">Gerencie as equipes da organização</p>
              </div>
              {canManage && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Equipe
                </Button>
              )}
            </div>

            {teams && teams.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <Card key={team.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>{team.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <p>
                            Criado por {team.profiles?.first_name} {team.profiles?.last_name}
                          </p>
                          <p>{new Date(team.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/teams/${team.id}`}>Ver Equipe</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">Nenhuma equipe encontrada</h3>
                <p className="text-muted-foreground mb-6">
                  Crie equipes para organizar melhor o trabalho e o feedback.
                </p>
                {canManage && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Equipe
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Membros</h2>
                <p className="text-muted-foreground">Gerencie os membros da organização</p>
              </div>
              {canManage && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Convidar Membro
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {members?.map((member, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{roleLabels[member.role as keyof typeof roleLabels]}</Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {canManage && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações da Organização</CardTitle>
                  <CardDescription>Gerencie as configurações e preferências da organização</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Configurações em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}

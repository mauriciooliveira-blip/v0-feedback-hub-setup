import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateFeedbackDialog } from "@/components/create-feedback-dialog"
import { FeedbackCard } from "@/components/feedback-card"
import { ArrowLeft, Plus, Filter } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrganizationFeedbackPage({ params }: PageProps) {
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
  const { data: organization } = await supabase.from("organizations").select("name").eq("id", id).single()

  if (!organization) {
    notFound()
  }

  // Get feedback categories
  const { data: categories } = await supabase
    .from("feedback_categories")
    .select("id, name, color")
    .eq("organization_id", id)

  // Get teams
  const { data: teams } = await supabase.from("teams").select("id, name").eq("organization_id", id)

  // Get all feedback
  const { data: allFeedback } = await supabase
    .from("feedback")
    .select(`
      id,
      title,
      description,
      type,
      priority,
      status,
      created_at,
      submitted_by,
      profiles!feedback_submitted_by_fkey (
        first_name,
        last_name
      ),
      feedback_categories (
        name,
        color
      ),
      teams (
        name
      )
    `)
    .eq("organization_id", id)
    .order("created_at", { ascending: false })

  // Get feedback counts by status
  const openFeedback = allFeedback?.filter((f) => f.status === "open") || []
  const inProgressFeedback = allFeedback?.filter((f) => f.status === "in_progress") || []
  const resolvedFeedback = allFeedback?.filter((f) => f.status === "resolved") || []

  // Get comment counts for each feedback
  const feedbackWithCounts = await Promise.all(
    (allFeedback || []).map(async (feedback) => {
      const { count: commentCount } = await supabase
        .from("feedback_comments")
        .select("id", { count: "exact" })
        .eq("feedback_id", feedback.id)

      const { count: voteCount } = await supabase
        .from("feedback_votes")
        .select("id", { count: "exact" })
        .eq("feedback_id", feedback.id)
        .eq("vote_type", "up")

      return {
        ...feedback,
        comment_count: commentCount || 0,
        vote_count: voteCount || 0,
      }
    }),
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/organizations/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback - {organization.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">Gerencie todo o feedback da organização</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <CreateFeedbackDialog
                organizationId={id}
                userId={user.id}
                categories={categories || []}
                teams={teams || []}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Feedback
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedbackWithCounts.length}</div>
              <p className="text-xs text-muted-foreground">Total de feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aberto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{openFeedback.length}</div>
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inProgressFeedback.length}</div>
              <p className="text-xs text-muted-foreground">Sendo trabalhado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resolvido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{resolvedFeedback.length}</div>
              <p className="text-xs text-muted-foreground">Concluído</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Todos ({feedbackWithCounts.length})</TabsTrigger>
            <TabsTrigger value="open">Aberto ({openFeedback.length})</TabsTrigger>
            <TabsTrigger value="in_progress">Em Progresso ({inProgressFeedback.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolvido ({resolvedFeedback.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {feedbackWithCounts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">Nenhum feedback encontrado</h3>
                <p className="text-muted-foreground mb-6">Comece criando o primeiro feedback da organização.</p>
                <CreateFeedbackDialog
                  organizationId={id}
                  userId={user.id}
                  categories={categories || []}
                  teams={teams || []}
                  trigger={
                    <Button size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Feedback
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbackWithCounts.map((feedback) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} organizationId={id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openFeedback.map((feedback) => {
                const feedbackWithCount = feedbackWithCounts.find((f) => f.id === feedback.id)
                return feedbackWithCount ? (
                  <FeedbackCard key={feedback.id} feedback={feedbackWithCount} organizationId={id} />
                ) : null
              })}
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressFeedback.map((feedback) => {
                const feedbackWithCount = feedbackWithCounts.find((f) => f.id === feedback.id)
                return feedbackWithCount ? (
                  <FeedbackCard key={feedback.id} feedback={feedbackWithCount} organizationId={id} />
                ) : null
              })}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resolvedFeedback.map((feedback) => {
                const feedbackWithCount = feedbackWithCounts.find((f) => f.id === feedback.id)
                return feedbackWithCount ? (
                  <FeedbackCard key={feedback.id} feedback={feedbackWithCount} organizationId={id} />
                ) : null
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

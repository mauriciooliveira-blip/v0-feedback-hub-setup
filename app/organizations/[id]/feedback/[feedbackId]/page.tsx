import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ThumbsUp, MessageSquare, Clock, AlertCircle, CheckCircle, XCircle, Edit, User } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string; feedbackId: string }>
}

const typeLabels = {
  bug: "Bug",
  feature: "Nova Funcionalidade",
  improvement: "Melhoria",
  complaint: "Reclamação",
  suggestion: "Sugestão",
  other: "Outro",
}

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
}

const statusLabels = {
  open: "Aberto",
  in_progress: "Em Progresso",
  resolved: "Resolvido",
  closed: "Fechado",
  rejected: "Rejeitado",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

const statusColors = {
  open: "bg-green-100 text-green-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
  rejected: "bg-red-100 text-red-800",
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "open":
      return <AlertCircle className="h-4 w-4" />
    case "in_progress":
      return <Clock className="h-4 w-4" />
    case "resolved":
      return <CheckCircle className="h-4 w-4" />
    case "closed":
      return <CheckCircle className="h-4 w-4" />
    case "rejected":
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { id, feedbackId } = await params
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

  // Get feedback details
  const { data: feedback } = await supabase
    .from("feedback")
    .select(`
      *,
      profiles!feedback_submitted_by_fkey (
        first_name,
        last_name,
        email
      ),
      assigned_profile:profiles!feedback_assigned_to_fkey (
        first_name,
        last_name,
        email
      ),
      feedback_categories (
        name,
        color
      ),
      teams (
        name
      )
    `)
    .eq("id", feedbackId)
    .eq("organization_id", id)
    .single()

  if (!feedback) {
    notFound()
  }

  // Get comments
  const { data: comments } = await supabase
    .from("feedback_comments")
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `)
    .eq("feedback_id", feedbackId)
    .order("created_at", { ascending: true })

  // Get vote count
  const { count: upVotes } = await supabase
    .from("feedback_votes")
    .select("id", { count: "exact" })
    .eq("feedback_id", feedbackId)
    .eq("vote_type", "up")

  // Check if user has voted
  const { data: userVote } = await supabase
    .from("feedback_votes")
    .select("vote_type")
    .eq("feedback_id", feedbackId)
    .eq("user_id", user.id)
    .single()

  const canManage =
    ["owner", "admin", "manager"].includes(membership.role) ||
    feedback.submitted_by === user.id ||
    feedback.assigned_to === user.id

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/organizations/${id}/feedback`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Feedback
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{feedback.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {feedback.profiles.first_name?.[0]}
                      {feedback.profiles.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {feedback.profiles.first_name} {feedback.profiles.last_name}
                  </span>
                </div>
                <span>•</span>
                <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {canManage && (
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Descrição</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${statusColors[feedback.status as keyof typeof statusColors]} flex items-center gap-1`}
                    >
                      <StatusIcon status={feedback.status} />
                      {statusLabels[feedback.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{feedback.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentários ({comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {comment.profiles.first_name?.[0]}
                              {comment.profiles.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {comment.profiles.first_name} {comment.profiles.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                          {comment.is_internal && (
                            <Badge variant="secondary" className="text-xs">
                              Interno
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum comentário ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    <Badge variant="outline">{typeLabels[feedback.type as keyof typeof typeLabels]}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={priorityColors[feedback.priority as keyof typeof priorityColors]}
                    >
                      {priorityLabels[feedback.priority as keyof typeof priorityLabels]}
                    </Badge>
                  </div>
                </div>

                {feedback.feedback_categories && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: feedback.feedback_categories.color }}
                      />
                      <span className="text-sm">{feedback.feedback_categories.name}</span>
                    </div>
                  </div>
                )}

                {feedback.teams && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Equipe</label>
                    <div className="mt-1">
                      <Badge variant="secondary">{feedback.teams.name}</Badge>
                    </div>
                  </div>
                )}

                {feedback.assigned_profile && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {feedback.assigned_profile.first_name?.[0]}
                          {feedback.assigned_profile.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {feedback.assigned_profile.first_name} {feedback.assigned_profile.last_name}
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">{upVotes || 0} votos</span>
                  </div>
                  <Button
                    variant={userVote ? "default" : "outline"}
                    size="sm"
                    disabled={feedback.submitted_by === user.id}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {userVote ? "Votado" : "Votar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Adicionar Comentário
                </Button>
                {canManage && (
                  <>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <User className="h-4 w-4 mr-2" />
                      Atribuir Responsável
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Edit className="h-4 w-4 mr-2" />
                      Alterar Status
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

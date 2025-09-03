import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface FeedbackItem {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  created_at: string
  submitted_by: string
  profiles: {
    first_name: string
    last_name: string
  }
  feedback_categories?: {
    name: string
    color: string
  }
  teams?: {
    name: string
  }
  comment_count?: number
  vote_count?: number
}

interface FeedbackCardProps {
  feedback: FeedbackItem
  organizationId: string
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

export function FeedbackCard({ feedback, organizationId }: FeedbackCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{feedback.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">{feedback.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge
              variant="secondary"
              className={`${statusColors[feedback.status as keyof typeof statusColors]} flex items-center gap-1`}
            >
              <StatusIcon status={feedback.status} />
              {statusLabels[feedback.status as keyof typeof statusLabels]}
            </Badge>
            <Badge variant="outline" className={priorityColors[feedback.priority as keyof typeof priorityColors]}>
              {priorityLabels[feedback.priority as keyof typeof priorityLabels]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
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

        <div className="flex items-center gap-4">
          <Badge variant="outline">{typeLabels[feedback.type as keyof typeof typeLabels]}</Badge>

          {feedback.feedback_categories && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: feedback.feedback_categories.color }} />
              <span className="text-sm text-muted-foreground">{feedback.feedback_categories.name}</span>
            </div>
          )}

          {feedback.teams && (
            <Badge variant="secondary" className="text-xs">
              {feedback.teams.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{feedback.comment_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{feedback.vote_count || 0}</span>
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={`/organizations/${organizationId}/feedback/${feedback.id}`}>Ver Detalhes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

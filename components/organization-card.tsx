import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Calendar } from "lucide-react"
import Link from "next/link"

interface Organization {
  id: string
  name: string
  description: string
  industry: string
  size_category: string
  created_at: string
  member_count?: number
  team_count?: number
  role: string
}

interface OrganizationCardProps {
  organization: Organization
}

const sizeLabels = {
  startup: "Startup",
  small: "Pequena",
  medium: "Média",
  large: "Grande",
  enterprise: "Enterprise",
}

const roleLabels = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  member: "Membro",
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{organization.name}</CardTitle>
          </div>
          <Badge variant="secondary">{roleLabels[organization.role as keyof typeof roleLabels]}</Badge>
        </div>
        <CardDescription className="line-clamp-2">{organization.description || "Sem descrição"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{organization.member_count || 0} membros</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{organization.team_count || 0} equipes</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{organization.industry}</p>
              <p className="text-xs text-muted-foreground">
                {sizeLabels[organization.size_category as keyof typeof sizeLabels]}
              </p>
            </div>
            <Button asChild>
              <Link href={`/organizations/${organization.id}`}>Acessar</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

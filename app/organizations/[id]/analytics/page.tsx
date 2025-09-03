import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnalyticsChart } from "@/components/analytics-chart"
import { MetricsCard } from "@/components/metrics-card"
import { ArrowLeft, BarChart3, TrendingUp, MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrganizationAnalyticsPage({ params }: PageProps) {
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

  // Get feedback statistics
  const { data: allFeedback } = await supabase
    .from("feedback")
    .select(`
      id,
      type,
      priority,
      status,
      created_at,
      resolved_at,
      feedback_categories (name, color)
    `)
    .eq("organization_id", id)

  // Calculate metrics
  const totalFeedback = allFeedback?.length || 0
  const openFeedback = allFeedback?.filter((f) => f.status === "open").length || 0
  const resolvedFeedback = allFeedback?.filter((f) => f.status === "resolved").length || 0
  const inProgressFeedback = allFeedback?.filter((f) => f.status === "in_progress").length || 0

  // Calculate resolution rate
  const resolutionRate = totalFeedback > 0 ? Math.round((resolvedFeedback / totalFeedback) * 100) : 0

  // Calculate average resolution time (in days)
  const resolvedWithTime = allFeedback?.filter((f) => f.status === "resolved" && f.resolved_at) || []
  const avgResolutionTime =
    resolvedWithTime.length > 0
      ? Math.round(
          resolvedWithTime.reduce((acc, f) => {
            const created = new Date(f.created_at)
            const resolved = new Date(f.resolved_at!)
            return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          }, 0) / resolvedWithTime.length,
        )
      : 0

  // Prepare chart data
  const statusData = [
    { name: "Aberto", value: openFeedback, color: "#10B981" },
    { name: "Em Progresso", value: inProgressFeedback, color: "#F59E0B" },
    { name: "Resolvido", value: resolvedFeedback, color: "#3B82F6" },
  ].filter((item) => item.value > 0)

  const typeData = [
    { name: "Bug", value: allFeedback?.filter((f) => f.type === "bug").length || 0 },
    { name: "Funcionalidade", value: allFeedback?.filter((f) => f.type === "feature").length || 0 },
    { name: "Melhoria", value: allFeedback?.filter((f) => f.type === "improvement").length || 0 },
    { name: "Sugestão", value: allFeedback?.filter((f) => f.type === "suggestion").length || 0 },
    { name: "Reclamação", value: allFeedback?.filter((f) => f.type === "complaint").length || 0 },
    { name: "Outro", value: allFeedback?.filter((f) => f.type === "other").length || 0 },
  ].filter((item) => item.value > 0)

  const priorityData = [
    { name: "Crítica", value: allFeedback?.filter((f) => f.priority === "critical").length || 0 },
    { name: "Alta", value: allFeedback?.filter((f) => f.priority === "high").length || 0 },
    { name: "Média", value: allFeedback?.filter((f) => f.priority === "medium").length || 0 },
    { name: "Baixa", value: allFeedback?.filter((f) => f.priority === "low").length || 0 },
  ].filter((item) => item.value > 0)

  // Monthly trend data (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthFeedback =
      allFeedback?.filter((f) => {
        const createdDate = new Date(f.created_at)
        return createdDate >= monthStart && createdDate <= monthEnd
      }).length || 0

    monthlyData.push({
      name: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      value: monthFeedback,
    })
  }

  const canViewAnalytics = ["owner", "admin", "manager"].includes(membership.role)

  if (!canViewAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para visualizar analytics desta organização.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/organizations/${id}`}>Voltar à Organização</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics - {organization.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">Insights e métricas de feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select defaultValue="30d">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                  <SelectItem value="1y">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard
                title="Total de Feedback"
                value={totalFeedback}
                description="Feedback coletado"
                icon={MessageSquare}
                trend={{ value: 12, isPositive: true }}
              />

              <MetricsCard
                title="Taxa de Resolução"
                value={`${resolutionRate}%`}
                description="Feedback resolvido"
                icon={CheckCircle}
                trend={{ value: 5, isPositive: true }}
              />

              <MetricsCard
                title="Tempo Médio de Resolução"
                value={`${avgResolutionTime}d`}
                description="Dias para resolver"
                icon={Clock}
                trend={{ value: 8, isPositive: false }}
              />

              <MetricsCard
                title="Feedback Aberto"
                value={openFeedback}
                description="Aguardando ação"
                icon={AlertTriangle}
                className={openFeedback > 10 ? "border-orange-200" : ""}
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnalyticsChart
                title="Status do Feedback"
                description="Distribuição por status"
                data={statusData}
                type="pie"
                dataKey="value"
                colors={["#10B981", "#F59E0B", "#3B82F6"]}
              />

              <AnalyticsChart
                title="Tipos de Feedback"
                description="Categorização por tipo"
                data={typeData}
                type="bar"
                dataKey="value"
                xAxisKey="name"
              />

              <AnalyticsChart
                title="Prioridade"
                description="Distribuição por prioridade"
                data={priorityData}
                type="bar"
                dataKey="value"
                xAxisKey="name"
                colors={["#EF4444"]}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Recente</CardTitle>
                <CardDescription>Últimos feedbacks por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {allFeedback && allFeedback.length > 0 ? (
                  <div className="space-y-3">
                    {allFeedback.slice(0, 5).map((feedback) => (
                      <div key={feedback.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {feedback.feedback_categories && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: feedback.feedback_categories.color }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {feedback.feedback_categories?.name || "Sem categoria"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              feedback.status === "open"
                                ? "bg-green-100 text-green-800"
                                : feedback.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {feedback.status === "open"
                              ? "Aberto"
                              : feedback.status === "in_progress"
                                ? "Em Progresso"
                                : "Resolvido"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum feedback encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid gap-6">
              <AnalyticsChart
                title="Tendência Mensal"
                description="Volume de feedback nos últimos 6 meses"
                data={monthlyData}
                type="line"
                dataKey="value"
                xAxisKey="name"
              />

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Crescimento</CardTitle>
                    <CardDescription>Comparação com período anterior</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Volume de Feedback</span>
                        <span className="text-sm font-medium text-green-600">+12%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taxa de Resolução</span>
                        <span className="text-sm font-medium text-green-600">+5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tempo de Resposta</span>
                        <span className="text-sm font-medium text-red-600">-8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Insights</CardTitle>
                    <CardDescription>Principais descobertas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Aumento de 25% em sugestões de melhorias</p>
                        <p className="text-xs text-blue-700">Indica maior engajamento da equipe</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Redução de 15% em bugs reportados</p>
                        <p className="text-xs text-green-700">Melhoria na qualidade do produto</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricsCard
                title="SLA de Resposta"
                value="94%"
                description="Dentro do prazo de 24h"
                icon={Clock}
                trend={{ value: 3, isPositive: true }}
              />

              <MetricsCard
                title="Satisfação Média"
                value="4.2/5"
                description="Avaliação dos usuários"
                icon={TrendingUp}
                trend={{ value: 7, isPositive: true }}
              />

              <MetricsCard
                title="Reincidência"
                value="8%"
                description="Feedback reaberto"
                icon={AlertTriangle}
                trend={{ value: 12, isPositive: false }}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Equipe</CardTitle>
                <CardDescription>Métricas de resolução por equipe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <span>Equipe</span>
                    <span>Resolvidos</span>
                    <span>Tempo Médio</span>
                    <span>Taxa de Sucesso</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="font-medium">Desenvolvimento</span>
                      <span>24</span>
                      <span>3.2 dias</span>
                      <span className="text-green-600">96%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="font-medium">Design</span>
                      <span>18</span>
                      <span>2.8 dias</span>
                      <span className="text-green-600">94%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <span className="font-medium">Produto</span>
                      <span>12</span>
                      <span>4.1 dias</span>
                      <span className="text-yellow-600">89%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Disponíveis</CardTitle>
                  <CardDescription>Gere relatórios personalizados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Relatório Mensal de Feedback
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Análise de Performance por Equipe
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Relatório de Satisfação
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Tendências e Previsões
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exportar Dados</CardTitle>
                  <CardDescription>Baixe os dados para análise externa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Exportar para CSV
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Exportar para Excel
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Gerar PDF Executivo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

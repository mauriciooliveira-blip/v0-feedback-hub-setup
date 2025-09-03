import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            FeedbackHub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto text-pretty">
            Transforme feedback em resultados. Gerencie, analise e melhore a experiência da sua equipe com nossa
            plataforma corporativa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/sign-up">Começar Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/auth/login">Fazer Login</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Coleta Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Capture feedback de forma estruturada com categorização automática e priorização inteligente.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Gestão de Equipes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Organize equipes, atribua responsabilidades e acompanhe o progresso em tempo real.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Analytics Avançado</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Dashboards interativos com métricas detalhadas para tomada de decisões baseada em dados.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

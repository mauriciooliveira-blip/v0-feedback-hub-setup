import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">FeedbackHub</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Ops, algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Erro: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Ocorreu um erro não especificado.</p>
              )}
              <Button asChild className="w-full">
                <Link href="/auth/login">Tentar Novamente</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">FeedbackHub</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Conta criada com sucesso!</CardTitle>
              <CardDescription className="text-center">Verifique seu email para confirmar</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta e fazer login.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Voltar para Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface CreateOrganizationDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export function CreateOrganizationDialog({ userId, trigger }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    sizeCategory: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.name,
          description: formData.description,
          website: formData.website,
          industry: formData.industry,
          size_category: formData.sizeCategory,
          created_by: userId,
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as owner
      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: org.id,
        user_id: userId,
        role: "owner",
      })

      if (memberError) throw memberError

      // Create default categories
      await supabase.rpc("create_default_categories", {
        org_id: org.id,
        creator_id: userId,
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating organization:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Criar Organização</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Organização</DialogTitle>
          <DialogDescription>Configure sua organização para começar a coletar feedback.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Organização</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Minha Empresa"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição da organização..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website (opcional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://minhaempresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Setor</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Tecnologia, Saúde, Educação..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">Tamanho da Empresa</Label>
              <Select
                value={formData.sizeCategory}
                onValueChange={(value) => setFormData({ ...formData, sizeCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (1-10 funcionários)</SelectItem>
                  <SelectItem value="small">Pequena (11-50 funcionários)</SelectItem>
                  <SelectItem value="medium">Média (51-200 funcionários)</SelectItem>
                  <SelectItem value="large">Grande (201-1000 funcionários)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000+ funcionários)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Organização"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Factory, Shield, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onLoggedIn: () => void
}

export function LoginScreen({ onLoggedIn }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-emerald-600 text-white mb-3">
            <Factory className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Form TTP</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Traceability to Plantation — Pabrik Kelapa Sawit
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="pks">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pks">
                  <Factory className="h-3.5 w-3.5 mr-1.5" />
                  Login PKS
                </TabsTrigger>
                <TabsTrigger value="admin">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pks" className="mt-4">
                <PksLoginForm onLoggedIn={onLoggedIn} />
              </TabsContent>

              <TabsContent value="admin" className="mt-4">
                <AdminLoginForm onLoggedIn={onLoggedIn} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Demo: PKS Bunga Raya → PIN 111111 · Admin → PIN 123456
        </p>
      </div>
    </div>
  )
}

function PksLoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pin.trim()) {
      toast.error('Nama PKS dan PIN wajib diisi')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/pks-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin: pin.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Login gagal')
      toast.success(`Selamat datang, ${data.pksName}`)
      onLoggedIn()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="pks-name">Nama PKS</Label>
        <Input
          id="pks-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: PKS Bunga Raya"
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pks-pin">PIN (6 digit)</Label>
        <Input
          id="pks-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="tracking-[0.5em] text-center"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <LogIn className="h-4 w-4 mr-1.5" />}
        Masuk sebagai PKS
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Masuk untuk mengisi dan mempublikasi laporan TTP PKS Anda.
      </p>
    </form>
  )
}

function AdminLoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      toast.error('PIN wajib diisi')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Login gagal')
      toast.success('Login admin berhasil')
      onLoggedIn()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="admin-pin">PIN Admin</Label>
        <Input
          id="admin-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="tracking-[0.5em] text-center"
        />
      </div>
      <Button type="submit" className="w-full" variant="default" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Shield className="h-4 w-4 mr-1.5" />}
        Masuk sebagai Admin
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Admin dapat melihat semua laporan yang sudah dipublikasi PKS dan melakukan rekap.
      </p>
    </form>
  )
}

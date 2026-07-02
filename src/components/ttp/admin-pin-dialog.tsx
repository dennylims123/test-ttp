'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function AdminPinDialog({ open, onSuccess, onCancel }: Props) {
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
      setPin('')
      toast.success('Login admin berhasil')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setPin('')
          onCancel()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-permata-deep-teal text-white">
              <Shield className="h-4 w-4" />
            </div>
            <DialogTitle>Akses Rekap Admin</DialogTitle>
          </div>
          <DialogDescription>
            Rekap Admin hanya untuk admin. Masukkan PIN admin untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="admin-pin-input">PIN Admin</Label>
            <Input
              id="admin-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="tracking-[0.5em] text-center"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4 mr-1.5" />
            )}
            Masuk
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

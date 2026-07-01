'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Check, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Village {
  id: number
  desa: string
  full: string
}

interface Props {
  value: string
  onChange: (val: string, village?: Village) => void
  placeholder?: string
  className?: string
}

export function VillageAutocomplete({ value, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Village[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback((q: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    fetch(`/api/villages?q=${encodeURIComponent(q)}&limit=30`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: Village[]) => {
        setResults(data)
        setLoading(false)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || query.length < 2) {
      return
    }
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (value) {
              setQuery(value)
              setOpen(true)
            }
          }}
          placeholder={placeholder || 'Cari desa...'}
          className={cn('h-9', className)}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Ketik nama desa..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? 'Mencari...'
                : query.length < 2
                ? 'Ketik minimal 2 karakter untuk mencari desa'
                : 'Tidak ditemukan'}
            </CommandEmpty>
            <CommandGroup>
              {results.map((v) => (
                <CommandItem
                  key={v.id}
                  value={String(v.id)}
                  onSelect={() => {
                    onChange(v.desa, v)
                    setOpen(false)
                  }}
                  className="flex items-start gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{v.desa}</div>
                    <div className="text-xs text-muted-foreground truncate">{v.full}</div>
                  </div>
                  {value === v.desa && <Check className="h-3.5 w-3.5 opacity-60" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

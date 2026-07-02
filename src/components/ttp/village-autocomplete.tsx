'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Check, MapPin, MapPinOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Village {
  id: number
  desa: string
  full: string
  msd_status?: string
}

interface Props {
  value: string
  onChange: (val: string, village?: Village) => void
  placeholder?: string
  className?: string
}

export function VillageAutocomplete({ value, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Village[]>([])
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback((q: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    fetch(`/api/villages?q=${encodeURIComponent(q)}&limit=20`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: Village[]) => {
        setResults(data)
        setLoading(false)
        setHighlightIndex(-1)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value || value.length < 2) {
      return
    }
    debounceRef.current = setTimeout(() => search(value), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, open, search])

  // Compute dropdown position relative to viewport (using position: fixed)
  // This avoids being clipped by table overflow-x-auto
  useLayoutEffect(() => {
    if (!open || !inputRef.current) return
    const updatePosition = () => {
      if (!inputRef.current) return
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 350),
        zIndex: 9999,
      })
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Also check if click is inside the portal dropdown
        const dropdown = document.getElementById('village-dropdown')
        if (dropdown && dropdown.contains(e.target as Node)) return
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      const v = results[highlightIndex]
      onChange(v.desa, v)
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (value && value.length >= 2) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Cari desa...'}
        className={cn('h-8 text-xs', className)}
      />
      {open && value && value.length >= 2 && typeof document !== 'undefined' && createPortal(
        <div
          id="village-dropdown"
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto"
        >
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Mencari...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <MapPinOff className="inline h-3 w-3 mr-1" />
              Tidak ditemukan di database. Anda bisa mengetik nama desa manual.
            </div>
          )}
          {!loading && results.length > 0 && (
            <>
              {results.map((v, i) => (
                <div
                  key={v.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(v.desa, v)
                    setOpen(false)
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={cn(
                    'flex items-start gap-2 px-3 py-1.5 cursor-pointer border-b last:border-b-0',
                    i === highlightIndex ? 'bg-permata-green-light' : 'hover:bg-gray-50'
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{v.desa}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{v.full}</div>
                  </div>
                  {v.msd_status && (
                    <span
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded shrink-0',
                        v.msd_status === 'MSD'
                          ? 'bg-permata-accent/15 text-permata-forest'
                          : v.msd_status === 'Non-MSD'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {v.msd_status}
                    </span>
                  )}
                  {value === v.desa && <Check className="h-3.5 w-3.5 opacity-60 shrink-0" />}
                </div>
              ))}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

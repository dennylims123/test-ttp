'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileArchive, Download, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  reportId: string | null
  supplierNo: number
  shpFileUrl: string | null
  shpFileName: string | null
  readOnly?: boolean
  onUploaded: (url: string, fileName: string) => void
  onDeleted: () => void
}

export function ShpUpload({
  reportId,
  supplierNo,
  shpFileUrl,
  shpFileName,
  readOnly = false,
  onUploaded,
  onDeleted,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!reportId) {
      toast.error('Simpan laporan terlebih dahulu sebelum upload SHP')
      return
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('File harus berformat .zip')
      return
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`Ukuran file maksimal 50MB (file Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reportId', reportId)
      formData.append('supplierNo', String(supplierNo))

      const r = await fetch('/api/upload-shp', {
        method: 'POST',
        body: formData,
      })

      const data = await r.json()
      if (!r.ok) {
        throw new Error(data.error || 'Upload gagal')
      }

      onUploaded(data.url, data.fileName)
      toast.success(`SHP file "${data.fileName}" berhasil diupload`)
    } catch (e: any) {
      toast.error('Gagal upload: ' + e.message)
    } finally {
      setUploading(false)
      // Reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = () => {
    if (!confirm(`Hapus file SHP "${shpFileName}"?`)) return
    onDeleted()
    toast.info('File SHP dihapus (simpan laporan untuk konfirmasi)')
  }

  const handleDownload = () => {
    if (shpFileUrl) {
      window.open(shpFileUrl, '_blank')
    }
  }

  // Read-only mode (published reports / admin view)
  if (readOnly) {
    if (!shpFileUrl) {
      return <span className="text-[10px] text-muted-foreground">—</span>
    }
    return (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1 px-2"
        onClick={handleDownload}
        title={`Download ${shpFileName}`}
      >
        <FileArchive className="h-3.5 w-3.5 text-permata-forest" />
        <span className="truncate max-w-[100px]">{shpFileName}</span>
        <Download className="h-3 w-3" />
      </Button>
    )
  }

  // Has file uploaded — show file name + download + delete
  if (shpFileUrl) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1 px-2"
          onClick={handleDownload}
          title={`Download ${shpFileName}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-permata-accent" />
          <span className="truncate max-w-[80px]">{shpFileName}</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={uploading}
          title="Hapus file SHP"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  // No file — show upload button
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading || !reportId}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1 px-2 border-permata-forest/30 text-permata-teal hover:bg-permata-green-light"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || !reportId}
        title={reportId ? 'Upload file SHP (.zip)' : 'Simpan laporan dulu sebelum upload'}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {uploading ? 'Uploading...' : 'SHP'}
      </Button>
    </div>
  )
}

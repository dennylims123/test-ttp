'use client'

import { useState, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ClipboardPaste,
  Upload,
  FileDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  parseBulkPaste,
  parseCsvFile,
  toFarmerRows,
  generateTemplateCsv,
  downloadString,
  type ParseResult,
} from '@/lib/ttp/bulk-import'

interface Props {
  open: boolean
  agenName: string
  existingCount: number
  onImport: (
    farmers: ReturnType<typeof toFarmerRows>,
    mode: 'replace' | 'append'
  ) => void
  onClose: () => void
}

export function BulkImportFarmers({
  open,
  agenName,
  existingCount,
  onImport,
  onClose,
}: Props) {
  const [pasteText, setPasteText] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleParse = useCallback((text: string) => {
    setPasteText(text)
    if (!text.trim()) {
      setParseResult(null)
      return
    }
    setParsing(true)
    // Use setTimeout to avoid blocking the UI for large pastes
    setTimeout(() => {
      try {
        const result = parseBulkPaste(text)
        setParseResult(result)
      } catch (e: any) {
        toast.error('Gagal memparse data: ' + e.message)
        setParseResult(null)
      } finally {
        setParsing(false)
      }
    }, 50)
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    setParsing(true)
    try {
      const result = await parseCsvFile(file)
      setParseResult(result)
      // Also populate the textarea with the raw content for visibility
      const text = await file.text()
      setPasteText(text)
      toast.success(`${result.farmers.length} baris terbaca dari file`)
    } catch (e: any) {
      toast.error('Gagal membaca file: ' + e.message)
    } finally {
      setParsing(false)
    }
  }, [])

  const handleDownloadTemplate = useCallback(() => {
    downloadString('template-petani.csv', generateTemplateCsv())
    toast.success('Template CSV diunduh')
  }, [])

  const handleImport = useCallback(
    (mode: 'replace' | 'append') => {
      if (!parseResult || parseResult.farmers.length === 0) {
        toast.error('Tidak ada data untuk diimpor')
        return
      }
      setImporting(true)
      try {
        const newFarmers = toFarmerRows(parseResult.farmers)
        onImport(newFarmers, mode)
        const action = mode === 'replace' ? 'menggantikan' : 'menambahkan'
        toast.success(
          `Berhasil ${action} ${newFarmers.length} petani${mode === 'append' ? ` (total: ${existingCount + newFarmers.length})` : ''}`
        )
        // Reset
        setPasteText('')
        setParseResult(null)
        onClose()
      } catch (e: any) {
        toast.error('Gagal mengimpor: ' + e.message)
      } finally {
        setImporting(false)
      }
    },
    [parseResult, onImport, existingCount, onClose]
  )

  const handleClose = () => {
    setPasteText('')
    setParseResult(null)
    onClose()
  }

  const warningCount = parseResult?.farmers.filter((f) => f._warnings.length > 0).length || 0
  const previewFarmers = useMemo(() => parseResult?.farmers.slice(0, 50) || [], [parseResult])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Massal Petani
          </DialogTitle>
          <DialogDescription>
            Agen: <strong>{agenName}</strong> · Saat ini: {existingCount} petani ·
            Tempel data dari Excel atau unggah file CSV untuk menambah ratusan/ribuan petani sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Download Template CSV
          </Button>
          <span className="text-[11px]">
            Format kolom: <strong>Nama, Lintang, Bujur, Legalitas, Desa, Kecamatan, Kabupaten, Luas (Ha)</strong>
          </span>
        </div>

        <Tabs defaultValue="paste" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="paste">
              <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
              Tempel
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Unggah File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="flex-1 overflow-hidden flex flex-col">
            <Label className="text-xs mb-1.5">
              Tempel data dari Excel (Ctrl+V). Pilih semua sel di Excel, copy, lalu paste di sini.
            </Label>
            <Textarea
              value={pasteText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder={`Pak Budi\t-0.344560\t109.937360\tHGU\tAmboyo Inti\tNgabang\tLandak\t3.5\nPak Sari\t-0.345058\t109.924778\tSKT\tAmboyo Selatan\tNgabang\tLandak\t2.0\n...`}
              className="flex-1 min-h-[200px] font-mono text-xs"
              disabled={parsing || importing}
            />
            {parsing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Memproses...
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-hidden flex flex-col">
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <Label htmlFor="csv-upload" className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
                  Klik untuk memilih file CSV
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                  disabled={parsing || importing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: .csv atau .txt · Kolom: Nama, Lintang, Bujur, Legalitas, Desa, Kecamatan, Kabupaten, Luas (Ha)
              </p>
              {parsing && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Membaca file...
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {parseResult && (
          <div className="border rounded-md flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between p-2 border-b bg-muted/40 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  <strong>{parseResult.farmers.length}</strong> baris siap diimpor
                </span>
                {parseResult.hadHeader && (
                  <Badge variant="secondary" className="text-[10px]">Header terdeteksi</Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  Delimiter: {parseResult.delimiter === '\t' ? 'Tab' : parseResult.delimiter === ';' ? ';' : ','}
                </Badge>
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    {warningCount} peringatan
                  </Badge>
                )}
                {parseResult.skippedRows > 0 && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {parseResult.skippedRows} baris dilewati
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                {parseResult.farmers.length > 50
                  ? `Menampilkan 50 dari ${parseResult.farmers.length}`
                  : ''}
              </span>
            </div>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0">
                  <TableRow>
                    <TableHead className="w-10">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-20">Lintang</TableHead>
                    <TableHead className="w-20">Bujur</TableHead>
                    <TableHead className="w-24">Legalitas</TableHead>
                    <TableHead>Desa</TableHead>
                    <TableHead>Kecamatan</TableHead>
                    <TableHead>Kabupaten</TableHead>
                    <TableHead className="w-20">Luas (Ha)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewFarmers.map((f, i) => (
                    <TableRow key={i} className={f._warnings.length > 0 ? 'bg-amber-50' : ''}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{f.nama}</TableCell>
                      <TableCell className="text-xs">{f.lintang || '-'}</TableCell>
                      <TableCell className="text-xs">{f.bujur || '-'}</TableCell>
                      <TableCell className="text-xs">{f.legalitas || '-'}</TableCell>
                      <TableCell className="text-xs">{f.desa || '-'}</TableCell>
                      <TableCell className="text-xs">{f.kecamatan || '-'}</TableCell>
                      <TableCell className="text-xs">{f.kabupaten || '-'}</TableCell>
                      <TableCell className="text-xs tabular-nums">{f.luasKebun ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={importing}>
            Batal
          </Button>
          {existingCount > 0 && parseResult && parseResult.farmers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImport('append')}
              disabled={importing || !parseResult?.farmers.length}
            >
              {importing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Users className="h-4 w-4 mr-1.5" />}
              Tambahkan ({parseResult.farmers.length})
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => handleImport('replace')}
            disabled={importing || !parseResult?.farmers.length}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {importing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
            {existingCount > 0 ? 'Ganti Semua' : 'Import'} ({parseResult?.farmers.length || 0})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

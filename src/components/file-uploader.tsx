import { useState, useRef, useCallback, useEffect } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"

interface StoredFile {
  id: number
  name: string
  url: string
  size: number
  created_at: string
}

const FILE_ICONS: Record<string, string> = {
  pdf: "FileText",
  doc: "FileText", docx: "FileText",
  xls: "FileSpreadsheet", xlsx: "FileSpreadsheet",
  ppt: "FileText", pptx: "FileText",
  jpg: "Image", jpeg: "Image", png: "Image", gif: "Image", webp: "Image", svg: "Image",
  mp4: "Film", mov: "Film", avi: "Film", mkv: "Film",
  mp3: "Music", wav: "Music",
  zip: "Archive", rar: "Archive", "7z": "Archive",
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  return FILE_ICONS[ext] || "File"
}

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFiles = () => {
    setLoading(true)
    fetch(func2url["list-files"])
      .then((r) => r.json())
      .then((data) => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        setFiles(parsed.files || [])
      })
      .catch(() => setError("Не удалось загрузить список файлов"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadFiles() }, [])

  const uploadFile = async (file: File): Promise<StoredFile> => {
    const res = await fetch(func2url["get-upload-url"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    })
    const raw = await res.text()
    const data = typeof raw === "string" ? JSON.parse(raw) : raw
    if (!res.ok) throw new Error(data.error || "Ошибка получения URL")

    const uploadRes = await fetch(data.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    })
    if (!uploadRes.ok) throw new Error("Ошибка загрузки в хранилище")

    return {
      id: data.id,
      name: data.name,
      url: data.cdn_url,
      size: data.size,
      created_at: new Date().toISOString(),
    }
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    setError(null)
    setUploading(true)
    try {
      const results = await Promise.all(Array.from(fileList).map(uploadFile))
      setFiles((prev) => [...results, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки")
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteFile = async (file: StoredFile) => {
    if (!confirm(`Удалить «${file.name}»?`)) return
    setDeletingId(file.id)
    try {
      const res = await fetch(func2url["delete-file"], {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: file.id }),
      })
      const raw = await res.text()
      const data = typeof raw === "string" ? JSON.parse(raw) : raw
      if (!res.ok) throw new Error(data.error || "Ошибка удаления")
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления")
    } finally {
      setDeletingId(null)
    }
  }

  const downloadFile = async (file: StoredFile) => {
    const res = await fetch(file.url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  }

  return (
    <div className="w-full space-y-4">

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border py-12 transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(24,144,255,0.2)]"
            : "border-white/8 bg-white/3 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_20px_rgba(24,144,255,0.1)]"
        } ${uploading ? "cursor-wait" : ""}`}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 ${isDragging ? "border-primary/60 bg-primary/20" : "border-white/10 bg-white/5 group-hover:border-primary/40 group-hover:bg-primary/10"}`}>
          {uploading
            ? <Icon name="Loader2" size={22} className="animate-spin text-primary" />
            : <Icon name="Upload" size={22} className={`transition-colors ${isDragging ? "text-primary" : "text-white/40 group-hover:text-primary"}`} />
          }
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/70">
            {uploading ? "Загружаем файлы..." : isDragging ? "Отпустите для загрузки" : "Перетащите файлы сюда"}
          </p>
          <p className="mt-0.5 font-mono text-xs text-white/25">
            {uploading ? "пожалуйста, подождите" : "или нажмите для выбора"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
          <Icon name="AlertCircle" size={14} className="shrink-0 text-red-400" />
          <p className="font-mono text-xs text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">
            <Icon name="X" size={12} />
          </button>
        </div>
      )}

      {/* Files list */}
      <div className="rounded-2xl border border-white/5 bg-white/2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="FolderOpen" size={13} className="text-primary/60" />
            <span className="font-mono text-xs text-white/40">
              {loading ? "загрузка..." : `${files.length} ${files.length === 1 ? "файл" : files.length >= 2 && files.length <= 4 ? "файла" : "файлов"}`}
            </span>
          </div>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs text-white/25 transition-colors hover:text-primary/70 disabled:opacity-40"
          >
            <Icon name={loading ? "Loader2" : "RefreshCw"} size={11} className={loading ? "animate-spin" : ""} />
            обновить
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-white/20">
            <Icon name="Loader2" size={16} className="animate-spin" />
            <span className="font-mono text-xs">загрузка списка...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-white/15">
            <Icon name="CloudOff" size={28} />
            <p className="font-mono text-xs">хранилище пустое</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {files.map((f) => (
              <div
                key={f.id}
                className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/2"
              >
                {/* Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/4">
                  <Icon name={getFileIcon(f.name)} size={14} className="text-primary/60" />
                </div>

                {/* Name + size */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/80">{f.name}</p>
                  <p className="font-mono text-xs text-white/25">{formatSize(f.size)}</p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => downloadFile(f)}
                    title="Скачать"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-white/40 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <Icon name="Download" size={13} />
                  </button>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Открыть"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-white/40 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <Icon name="ExternalLink" size={13} />
                  </a>
                  <button
                    onClick={() => deleteFile(f)}
                    disabled={deletingId === f.id}
                    title="Удалить"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-white/40 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  >
                    {deletingId === f.id
                      ? <Icon name="Loader2" size={13} className="animate-spin" />
                      : <Icon name="Trash2" size={13} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

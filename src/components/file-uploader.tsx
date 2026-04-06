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
    // Шаг 1: получаем presigned URL от бэкенда
    const res = await fetch(func2url["get-upload-url"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    })
    const raw = await res.text()
    const data = typeof raw === "string" ? JSON.parse(raw) : raw
    if (!res.ok) throw new Error(data.error || "Ошибка получения URL")

    // Шаг 2: загружаем файл напрямую в S3 через presigned URL
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const deleteFile = async (file: StoredFile) => {
    if (!confirm(`Удалить "${file.name}"?`)) return
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 transition-all duration-200 ${
          isDragging
            ? "border-foreground/60 bg-foreground/10"
            : "border-foreground/20 bg-foreground/5 hover:border-foreground/40"
        } ${uploading ? "cursor-wait opacity-70" : ""}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/10">
          {uploading
            ? <Icon name="Loader2" size={28} className="animate-spin text-foreground/60" />
            : <Icon name="Upload" size={28} className="text-foreground/60" />
          }
        </div>
        <div className="text-center">
          <p className="text-lg font-light text-foreground">
            {uploading ? "Загружаем..." : "Перетащите файлы сюда"}
          </p>
          <p className="mt-1 font-mono text-sm text-foreground/50">
            или нажмите для выбора · фото, видео, документы
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

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2">
          <Icon name="AlertCircle" size={14} className="shrink-0 text-red-400" />
          <p className="font-mono text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Files list */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-xs text-foreground/50">
            {loading ? "Загрузка..." : `Файлов в хранилище: ${files.length}`}
          </p>
          {!loading && (
            <button onClick={loadFiles} className="font-mono text-xs text-foreground/40 transition-colors hover:text-foreground/70">
              Обновить
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-foreground/40">
            <Icon name="Loader2" size={14} className="animate-spin" />
            <span className="font-mono text-xs">Загрузка списка...</span>
          </div>
        ) : files.length === 0 ? (
          <p className="font-mono text-xs text-foreground/30">Пока нет файлов — загрузите первый</p>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon name="File" size={16} className="shrink-0 text-foreground/50" />
                  <span className="truncate text-sm text-foreground">{f.name}</span>
                  <span className="shrink-0 font-mono text-xs text-foreground/40">{formatSize(f.size)}</span>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 font-mono text-xs text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <Icon name="ExternalLink" size={12} />
                    Открыть
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFile(f) }}
                    disabled={deletingId === f.id}
                    className="flex items-center gap-1 font-mono text-xs text-red-400/60 transition-colors hover:text-red-400 disabled:opacity-40"
                  >
                    {deletingId === f.id
                      ? <Icon name="Loader2" size={12} className="animate-spin" />
                      : <Icon name="Trash2" size={12} />
                    }
                    Удалить
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
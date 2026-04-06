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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(func2url["list-files"])
      .then((r) => r.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => setError("Не удалось загрузить список файлов"))
      .finally(() => setLoading(false))
  }, [])

  const uploadFile = async (file: File): Promise<StoredFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1]
          const res = await fetch(func2url["upload-file"], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: base64, name: file.name, type: file.type }),
          })
          const raw = await res.text()
          const data = JSON.parse(raw)
          if (!res.ok) reject(new Error(data.error || "Ошибка загрузки"))
          else resolve(data)
        } catch {
          reject(new Error("Ошибка загрузки"))
        }
      }
      reader.onerror = () => reject(new Error("Ошибка чтения файла"))
      reader.readAsDataURL(file)
    })
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
        } ${uploading ? "cursor-wait" : ""}`}
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
            или нажмите для выбора
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
        <p className="mt-3 font-mono text-sm text-red-400">{error}</p>
      )}

      {/* Files list */}
      <div className="mt-6">
        <p className="mb-3 font-mono text-xs text-foreground/50">
          {loading ? "Загружаем список..." : `Файлов в хранилище: ${files.length}`}
        </p>
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center gap-2 text-foreground/40">
              <Icon name="Loader2" size={14} className="animate-spin" />
              <span className="font-mono text-xs">Загрузка...</span>
            </div>
          )}
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Icon name="File" size={16} className="shrink-0 text-foreground/50" />
                <span className="truncate text-sm text-foreground">{f.name}</span>
                <span className="shrink-0 font-mono text-xs text-foreground/40">{formatSize(f.size)}</span>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-4 flex shrink-0 items-center gap-1 font-mono text-xs text-foreground/50 transition-colors hover:text-foreground"
              >
                <Icon name="ExternalLink" size={12} />
                Открыть
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { FileUploader } from "@/components/file-uploader"

export default function Index() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">

      {/* Background glows */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(24,144,255,0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(24,144,255,0.3)] to-transparent" />
      </div>

      {/* Nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/5 bg-background/80 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <span className="font-mono text-sm font-bold text-primary">B</span>
          </div>
          <span className="font-mono text-sm font-medium tracking-wide text-white">
            Biblioteca_Inform<span className="text-primary">.ru</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs text-primary/80">online</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-16">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="mb-10 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary/60">
              облачное хранилище
            </p>
            <h1 className="mb-3 font-sans text-4xl font-light tracking-tight text-white">
              Ваши файлы всегда под рукой
            </h1>
            <p className="font-mono text-sm text-white/30">
              загрузите, откройте или скачайте в любой момент
            </p>
          </div>

          {/* Uploader */}
          <FileUploader />

        </div>
      </div>
    </main>
  )
}

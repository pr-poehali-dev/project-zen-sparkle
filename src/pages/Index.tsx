import { WorkSection } from "@/components/sections/work-section"
import { ServicesSection } from "@/components/sections/services-section"
import { AboutSection } from "@/components/sections/about-section"
import { GrainOverlay } from "@/components/grain-overlay"
import { FileUploader } from "@/components/file-uploader"

export default function Index() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <GrainOverlay />

      {/* Static gradient background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d1a3a] to-[#0a0a1a]" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_60%_20%,rgba(18,117,216,0.25)_0%,transparent_60%)]" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(225,145,54,0.12)_0%,transparent_50%)]" />

      {/* Nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-foreground/10 bg-background/60 px-12 py-4 backdrop-blur-md">
        <button
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/15">
            <span className="font-sans text-lg font-bold text-foreground">И</span>
          </div>
          <span className="font-sans text-lg font-semibold tracking-tight text-foreground">Информатика Хранилище</span>
        </button>

        <div className="flex items-center gap-8">
          {[
            { label: "Главная", id: "hero" },
            { label: "Для кого", id: "for-whom" },
            { label: "Как работает", id: "how-it-works" },
            { label: "О нас", id: "about" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="group relative font-sans text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>

      </nav>

      {/* Sections */}
      <div className="relative z-10">
        {/* Hero */}
        <section id="hero" className="flex min-h-screen flex-col items-center justify-center px-12 pt-20">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-block rounded-full border border-foreground/20 bg-foreground/10 px-4 py-1.5">
              <p className="font-mono text-xs text-foreground/80">Облачное хранилище</p>
            </div>
            <h1 className="mb-4 font-sans text-6xl font-light leading-[1.1] tracking-tight text-foreground lg:text-7xl">
              Просто облако для ваших файлов
            </h1>
            <p className="text-lg leading-relaxed text-foreground/60">
              Перетащите файлы или нажмите — и они уже в облаке
            </p>
          </div>
          <FileUploader />
        </section>

        {/* For Whom */}
        <section id="for-whom">
          <WorkSection />
        </section>

        {/* How it works */}
        <section id="how-it-works">
          <ServicesSection />
        </section>

        {/* About */}
        <section id="about">
          <AboutSection />
        </section>
      </div>
    </main>
  )
}
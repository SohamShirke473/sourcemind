import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="font-mono text-lg font-bold tracking-tight">
          SourceMind
        </span>
        <Link
          href="/dashboard"
          className="font-mono text-sm font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </nav>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-4 font-mono text-5xl font-bold tracking-tight sm:text-6xl">
          Chat with your sources
        </h1>
        <p className="mb-8 max-w-xl font-mono text-sm text-muted-foreground">
          Upload documents, scrape websites, link YouTube videos — then ask
          questions and get answers grounded in your own content.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 font-mono text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
      </main>
    </div>
  );
}

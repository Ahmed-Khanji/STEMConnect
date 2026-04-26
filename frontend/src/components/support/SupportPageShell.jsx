export default function SupportPageShell({ title, description, children }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>

        <section className="space-y-6">{children}</section>
      </div>
    </main>
  );
}

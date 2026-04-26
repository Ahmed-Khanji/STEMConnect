import SupportPageShell from "@/components/support/SupportPageShell.jsx";

export default function Safety() {
  return (
    <SupportPageShell
      title="Safety"
      description="How STEMConnect helps keep collaboration respectful, secure, and productive."
    >
      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Community Standards</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We expect respectful behavior in chats, project workspaces, and all shared collaboration spaces.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold">Protect Your Account</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Use a strong unique password.</li>
            <li>Do not share login credentials.</li>
            <li>Log out on shared or public devices.</li>
          </ul>
        </article>

        <article className="rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold">Protect Your Data</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Avoid posting personal identifiers in public channels.</li>
            <li>Share files only with trusted class or project members.</li>
            <li>Review attachments before downloading.</li>
          </ul>
        </article>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Report a Safety Issue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you see harassment, impersonation, or suspicious behavior, contact support with relevant context such as
          course or project name and approximate time.
        </p>
      </div>
    </SupportPageShell>
  );
}

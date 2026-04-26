import SupportPageShell from "@/components/support/SupportPageShell.jsx";

export default function Terms() {
  return (
    <SupportPageShell
      title="Terms"
      description="Core terms for responsible use of STEMConnect services."
    >
      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Acceptable Use</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Use the platform for study and project collaboration.</li>
          <li>Do not post abusive, illegal, or misleading content.</li>
          <li>Respect copyrights and intellectual property rights.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Account Responsibility</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>You are responsible for account activity under your credentials.</li>
          <li>Keep your profile information accurate and up to date.</li>
          <li>Report unauthorized account use as soon as possible.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Enforcement</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts that violate platform policies may be limited, suspended, or removed to protect the community.
        </p>
      </div>
    </SupportPageShell>
  );
}

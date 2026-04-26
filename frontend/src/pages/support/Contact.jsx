import SupportPageShell from "@/components/support/SupportPageShell.jsx";

export default function Contact() {
  return (
    <SupportPageShell
      title="Contact"
      description="Reach out for support, account help, or platform feedback."
    >
      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Support Channels</h2>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">General support:</span> support@stemconnect.app
          </p>
          <p>
            <span className="font-medium text-foreground">Safety reports:</span> safety@stemconnect.app
          </p>
          <p>
            <span className="font-medium text-foreground">Partnerships:</span> partners@stemconnect.app
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">What to Include</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Your account email and role (student, team lead, etc.).</li>
          <li>Course or project context related to the issue.</li>
          <li>Short steps to reproduce and expected behavior.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Response Time</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We typically reply within 1-2 business days. Urgent safety concerns are prioritized.
        </p>
      </div>
    </SupportPageShell>
  );
}

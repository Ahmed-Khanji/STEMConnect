import SupportPageShell from "@/components/support/SupportPageShell.jsx";

export default function Privacy() {
  return (
    <SupportPageShell
      title="Privacy"
      description="A practical overview of what data is collected and how it is used in STEMConnect."
    >
      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">What We Collect</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Account details such as name and email.</li>
          <li>Workspace activity like messages and uploaded files.</li>
          <li>Course and project membership needed for access control.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">How Data Is Used</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Authenticate users and secure private spaces.</li>
          <li>Enable collaboration features like chat and shared resources.</li>
          <li>Improve reliability and troubleshoot platform issues.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border p-5 md:p-6">
        <h2 className="text-base font-semibold">Your Privacy Choices</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can request profile updates or account removal by contacting support. We review requests and process them
          according to platform obligations and applicable rules.
        </p>
      </div>
    </SupportPageShell>
  );
}

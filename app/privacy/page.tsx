export const metadata = { title: "Privacy | BindLab" };

export default function PrivacyPage() {
  return <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Privacy</p>
    <h1 className="mt-3 text-4xl font-semibold">BindLab public prototype privacy</h1>
    <div className="mt-8 grid gap-5 leading-7 text-ink/75">
      <p>Experiment records saved locally remain in browser localStorage on the current browser and device. They are not synchronized, and clearing browser data may delete them.</p>
      <p>Uploaded reaction PDFs and the instructions supplied with them are processed to extract text and may be sent to Google&apos;s Gemini API for document interpretation. The current application does not intentionally persist uploaded PDF files after the request completes, but provider processing is governed by the provider account and terms configured by BindLab.</p>
      <p>Server logs are designed to record request identifiers and sanitized error categories, not full experiment instructions. Cloud experiment storage is not enabled by the current user interface while authenticated ownership controls are being verified.</p>
      <p>Do not upload confidential, personally identifying, regulated, or unpublished laboratory information during the public prototype stage unless your organization has independently verified the deployment and provider configuration.</p>
      <p>Beta feedback submits only the category, feature, description and optional contact, role and usefulness rating you enter. Where configured, it is stored in BindLab’s existing Supabase project for administrator review. No experimental contents are attached automatically. Feedback administrators are instructed to delete records after 30 days; automatic deletion depends on deployment configuration. If submission fails, downloaded feedback remains under your control until you choose to share it. No behavioral analytics are collected by this beta.</p>
    </div>
  </main>;
}

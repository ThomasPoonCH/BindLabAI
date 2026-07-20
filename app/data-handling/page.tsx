export const metadata = { title: "Data Handling | BindLab" };

export default function DataHandlingPage() {
  return <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Data handling</p>
    <h1 className="mt-3 text-4xl font-semibold">How prototype data is handled</h1>
    <div className="mt-8 grid gap-5 leading-7 text-ink/75">
      <p><strong>Local records:</strong> saved only in the current browser&apos;s localStorage. They do not follow a user to another browser or device and may disappear when site data is cleared.</p>
      <p><strong>PDF processing:</strong> accepted PDFs are held in request memory for text extraction and, when requested, sent to the configured Gemini provider for visual interpretation. The application does not create a permanent upload file or database record from this processing route.</p>
      <p><strong>Prompts and responses:</strong> are used to create the requested draft. Application error logging excludes full instructions and raw provider error bodies. Provider-side handling depends on the configured Google account and applicable terms.</p>
      <p><strong>Cloud records:</strong> secure account infrastructure exists, but the product continues to save locally until ownership migration and isolation testing are completed. When cloud saving is introduced, authenticated users will be able to request deletion of their own records.</p>
    </div>
  </main>;
}

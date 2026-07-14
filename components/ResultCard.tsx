export function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      <div className="text-sm leading-6 text-ink/78">{children}</div>
    </section>
  );
}

export const metadata = { title: "Terms | BindLab" };

export default function TermsPage() {
  return <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Terms</p>
    <h1 className="mt-3 text-4xl font-semibold">Prototype terms of use</h1>
    <div className="mt-8 grid gap-5 leading-7 text-ink/75">
      <p>BindLab is a research workflow and calculation-support prototype. It does not replace qualified researcher judgment, supervisor approval, institutional SOPs, hazard assessments, SDS review, or instrument methods.</p>
      <p>BindLab provides calculation and workflow support. Users must verify quantities, units, hazards, SDS information and laboratory procedures before execution.</p>
      <p>AI-generated content is an editable draft for qualified review, not an independently validated fact. Deterministic calculator results remain the calculation source of truth and must be independently verified. BindLab is not an autonomous laboratory-control system.</p>
      <p>Do not use generated content as authorization to perform an experiment. Confirm all missing information, assumptions, chemical identities, concentrations, equipment requirements, and disposal procedures before laboratory work.</p>
    </div>
  </main>;
}

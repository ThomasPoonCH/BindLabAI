import { HomeNavbar } from "@/components/HomeNavbar";

export const metadata = {
  title: "About | BindLab AI",
  description: "About Thomas Poon and BindLab."
};

export default function AboutPage() {
  return (
    <main className="bg-paper text-ink">
      <section className="relative h-[78vh] min-h-[520px] overflow-hidden md:h-[88vh] md:min-h-[680px] md:max-h-[920px]">
        <img
          src="/assets/sense-of-chemistry.png"
          alt="Hand-drawn molecular structure"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 z-[1] bg-black/[0.26]" />
        <HomeNavbar tone="light" />
        <div className="relative z-10 flex h-full items-center justify-center px-4 pt-28">
          <h1 className="text-center text-3xl font-extralight uppercase tracking-[0.28em] text-white/95 drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:text-5xl md:text-6xl">
            Sense of Chemistry
          </h1>
        </div>
      </section>

      <section className="bg-white px-4 pb-20 pt-3 sm:px-6 md:pb-28 md:pt-6">
        <div className="mx-auto max-w-7xl">
          <h2
            aria-hidden="true"
            className="min-h-[12px] text-center text-[clamp(42px,5.5vw,84px)] font-normal leading-[0.98] tracking-normal text-ink md:min-h-[16px]"
            style={{ fontFamily: '"Didot", "Bodoni 72", "Bodoni 72 Display", Georgia, serif' }}
          />

          <div className="relative mx-auto mt-3 max-w-[1220px] border border-[#c5a46d]/35 bg-white px-7 py-14 sm:px-12 md:mt-5 md:min-h-[620px] md:px-16 md:py-16">
            <div className="pointer-events-none absolute -inset-3 -z-0 border border-[#c5a46d]/20" />
            <div className="pointer-events-none absolute -inset-x-6 -inset-y-2 -z-0 border border-[#c5a46d]/15" />
          <div className="relative z-10 mx-auto grid max-w-[1060px] gap-12 md:grid-cols-[0.38fr_0.62fr] md:items-center md:gap-[clamp(70px,8vw,100px)]">
            <div className="mx-auto flex w-full max-w-[340px] flex-col items-center text-center">
              <img
                src="/assets/founder-%20portrait.png"
                alt="Thomas Poon"
                className="h-[410px] w-[330px] max-w-full object-cover object-[44%_34%] shadow-[0_18px_50px_rgba(23,32,27,0.10)]"
              />
              <h3
                className="mt-5 text-center text-[18px] font-normal uppercase leading-none tracking-[0.18em] text-[#c1a06b]"
                style={{ fontFamily: '"Didot", "Bodoni 72", "Bodoni 72 Display", Georgia, serif' }}
              >
                Thomas Poon
              </h3>
              <p
                className="mt-2 text-center text-sm font-light italic leading-none text-[#c1a06b]/90"
                style={{ fontFamily: '"Didot", "Bodoni 72", "Bodoni 72 Display", Georgia, serif' }}
              >
                Founder of BindLab
              </p>
            </div>

            <article className="mx-auto w-full max-w-[620px] text-center">
              <h3 className="text-[clamp(25px,3vw,34px)] font-normal uppercase tracking-[0.18em] text-[#c1a06b]" style={{ fontFamily: '"Didot", "Bodoni 72", "Bodoni 72 Display", Georgia, serif' }}>Founder of BindLab</h3>
              <blockquote className="mx-auto mt-8 max-w-[520px] text-center text-[20px] font-normal italic leading-[1.45] text-ink/80 md:text-[23px]" style={{ fontFamily: '"Didot", "Bodoni 72", "Bodoni 72 Display", Georgia, serif' }}>
                “The best way to predict the future is by creating it.”
              </blockquote>
              <div className="mx-auto my-10 h-px w-[320px] max-w-full bg-[#c5a46d]" />
              <div lang="en" className="biography-paragraph mx-auto max-w-[570px] space-y-4 text-[15px] font-light leading-[1.85] tracking-normal text-ink/65">
                <p>
                  Thomas Poon founded BindLab to make the translation from scientific theory to precise laboratory action clearer, more structured, and more confident.
                </p>
                <p>
                  Trained in chemistry at The University of Hong Kong, he has worked across chemical biology, reaction preparation, scientific communication, and educational design. BindLab grew from seeing how often protocols explain what to do without making the reasoning, calculations, and likely points of error equally clear.
                </p>
                <p>
                  BindLab brings together scientific reasoning, deterministic calculation, refined visual design, and carefully constrained AI to create clear, reviewable experimental workflows. Its purpose is simple: help researchers prepare with greater understanding, precision, and confidence.
                </p>
              </div>
            </article>
          </div>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

// import NotifyForm from "./NotifyForm";

interface WrapperProps {
  children: React.ReactNode;
}

const MaintenancePage: React.FC<WrapperProps> = ({ children }) => {
  // Env var must be prefixed with NEXT_PUBLIC_ to be available in the browser.
  // Set NEXT_PUBLIC_IS_LIVE=true in .env.local (or your deployment env) to show the app.
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";

  if (isLive) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-[#16151F] text-[#E8E6F0] flex items-center justify-center overflow-hidden px-4 py-16">
      {/* Background orbs */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-[#534AB7] opacity-[0.12] blur-[80px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-[#1D9E75] opacity-[0.12] blur-[80px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-[60%] top-[40%] h-[300px] w-[300px] rounded-full bg-[#7F77DD] opacity-[0.12] blur-[80px]"
      />

      <main className="relative z-10 flex w-full max-w-[520px] flex-col items-center text-center">
        {/* Badge */}
        <div
          role="status"
          aria-label="Scheduled maintenance in progress"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#7F77DD]/40 bg-[#534AB7]/20 px-4 py-1.5 text-[11px] font-medium uppercase tracking-widest text-[#AFA9EC]"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5DCAA5]" />
          Scheduled maintenance
        </div>

        {/* Wrench icon */}
        <div
          aria-hidden
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-[20px] border border-[#7F77DD]/30 bg-[#534AB7]/15"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9 stroke-[#7F77DD]"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-[clamp(28px,6vw,40px)] font-semibold leading-tight tracking-tight text-[#E8E6F0]">
          We&apos;re tuning
          <br />
          things <span className="text-[#7F77DD]">up.</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-[400px] text-[15px] leading-relaxed text-[#888780]">
          Our team is working on scheduled improvements to make your experience
          better. We&apos;ll be back online shortly.
        </p>

        {/* Notify form */}
        {/* <NotifyForm /> */}

        {/* Footer */}
        <p className="mt-8 text-xs text-[#444441]">
          Questions?{" "}
          <a
            href="mailto:support@avexi.app"
            className="text-[#888780] transition-colors hover:text-[#AFA9EC]"
          >
            support@avexi.digital
          </a>
        </p>
      </main>
    </div>
  );
};

export default MaintenancePage;
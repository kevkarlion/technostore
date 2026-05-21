"use client";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  // Optional: log to monitoring here
  console.error(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold text-slate-50">
        Something went wrong.
      </h1>
      <p className="max-w-md text-xs text-slate-400">
        We hit an unexpected error while rendering this page. Try again, or
        return to the home page.
      </p>
      <div className="flex gap-3 text-xs">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-cyan-500 px-4 py-2 font-semibold text-slate-950 shadow-sm shadow-cyan-500/40 transition hover:bg-cyan-400"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 font-medium text-slate-100 transition hover:bg-slate-800"
        >
          Back home
        </a>
      </div>
    </div>
  );
}


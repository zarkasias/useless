// Styles still shared by the homepage panels (how it works, games, Pro).
// The card wall's own styles live in components/card-wall.

const button =
  "inline-flex min-h-[52px] items-center justify-center gap-4 rounded-full border border-transparent px-6 py-3.5 text-sm font-extrabold leading-[1.4] no-underline transition-[transform,background] duration-[180ms]";

const primaryButton = `${button} bg-[linear-gradient(100deg,#7c3aed,#3b82f6)] text-white shadow-[0_8px_24px_#8b5cf630] hover:-translate-y-0.5 hover:bg-[linear-gradient(100deg,#6d28d9,#2563eb)]`;

const textLink =
  "inline-block border-0 bg-transparent py-2.5 text-sm font-[750] text-inherit underline underline-offset-[5px]";

const finePrint = "my-4 text-xs leading-[1.2] opacity-70";

const homeStyles = {
  home: "relative bg-transparent text-gray-700 [--paper:#ffffff] [--ink:#374151] [--green:#7c3aed] [--acid:#e0e7ff] [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-[0.65] [&_button]:[-webkit-tap-highlight-color:transparent] [&_a]:[-webkit-tap-highlight-color:transparent] [&_select]:[-webkit-tap-highlight-color:transparent] [&_button:focus-visible]:outline-[3px] [&_button:focus-visible]:outline-[#8062d6] [&_button:focus-visible]:outline-offset-[5px] [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-[#8062d6] [&_a:focus-visible]:outline-offset-[5px] [&_select:focus-visible]:outline-[3px] [&_select:focus-visible]:outline-[#8062d6] [&_select:focus-visible]:outline-offset-[5px] motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none! motion-reduce:[&_*::after]:animate-none! motion-reduce:[&_*::after]:transition-none!",

  primaryButton,
  textLink,
  finePrint,

  segmented:
    "flex gap-1 rounded-full border border-violet-100 bg-[#f3f0ff] p-1.5 [&_button]:min-h-11 [&_button]:min-w-0 [&_button]:flex-1 [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-xs [&_button]:font-extrabold [&_button]:leading-[1.4] [&_button]:text-slate-500 [&_button]:transition-[background,color,box-shadow] [&_button]:duration-[180ms] [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-violet-600 [&_button[aria-pressed=true]]:shadow-[0_2px_8px_#8b5cf620]",

  planBadge:
    "mt-0 mb-6 inline-flex rounded-full bg-[linear-gradient(100deg,#7c3aed,#3b82f6)] px-4 py-2 text-[11px] font-extrabold tracking-[0.08em] text-white uppercase shadow-[0_4px_14px_#8b5cf625]",

  plan: "mx-auto max-w-[410px] rounded-3xl border border-violet-300 bg-white p-7 shadow-[0_18px_45px_#8b5cf625] [&>a]:w-full max-[700px]:p-6",

  price:
    "my-7 flex items-baseline justify-center gap-1.5 [&_strong]:text-[44px] [&_strong]:font-black [&_strong]:leading-none [&_strong]:tracking-[-0.065em] [&_span]:text-sm max-[700px]:[&_strong]:text-[58px]",

  planFeatures:
    "mt-0 mb-7 grid list-none gap-2.5 p-0 text-left text-[13px] [&_li]:before:mr-2.5 [&_li]:before:font-black [&_li]:before:text-violet-600 [&_li]:before:content-['✓']",
} as const;

export default homeStyles;

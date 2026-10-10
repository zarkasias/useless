const section =
  "relative scroll-mt-20 px-6 py-[66px] max-[700px]:px-5 max-[700px]:py-16";

const actions =
  "flex flex-wrap items-center justify-center gap-5 max-[700px]:gap-3";

const button =
  "inline-flex min-h-[52px] items-center justify-center gap-4 rounded-full border border-transparent px-6 py-3.5 text-sm font-extrabold leading-[1.4] no-underline transition-[transform,background] duration-[180ms]";

const primaryButton = `${button} bg-[linear-gradient(100deg,#7c3aed,#3b82f6)] text-white shadow-[0_8px_24px_#8b5cf630] hover:-translate-y-0.5 hover:bg-[linear-gradient(100deg,#6d28d9,#2563eb)]`;

const textLink =
  "inline-block border-0 bg-transparent py-2.5 text-sm font-[750] text-inherit underline underline-offset-[5px]";

const finePrint = "my-4 text-xs leading-[1.2] opacity-70";

const sectionHeading =
  "mx-auto mb-12 max-w-[800px] text-center max-[700px]:mb-[34px] [&_h2]:mb-[22px] [&_h2]:text-[clamp(36px,5vw,66px)] [&_h2]:font-black [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.06em] [&>p:last-child]:mx-auto [&>p:last-child]:max-w-[560px] [&>p:last-child]:text-base [&>p:last-child]:leading-[1.8] [&>p:last-child]:opacity-75 max-[700px]:[&>p:last-child]:text-sm";

const gradientTitle =
  "[&_span]:inline-block [&_span]:pb-[0.12em] [&_span]:bg-[linear-gradient(100deg,#7c3aed_10%,#3b82f6_55%,#0891b2_100%)] [&_span]:bg-clip-text [&_span]:text-transparent";

const orbit =
  "pointer-events-none absolute left-1/2 top-[44%] rounded-full border border-[#22251f20]";

const sceneNote =
  "absolute top-[43%] max-w-[150px] text-xl font-extrabold leading-[1.2] tracking-[-0.04em] max-[700px]:hidden";

const homeStyles = {
  home: "bg-white text-gray-700 [--paper:#ffffff] [--ink:#374151] [--green:#7c3aed] [--acid:#e0e7ff] [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-[0.65] [&_button]:[-webkit-tap-highlight-color:transparent] [&_a]:[-webkit-tap-highlight-color:transparent] [&_select]:[-webkit-tap-highlight-color:transparent] [&_button:focus-visible]:outline-[3px] [&_button:focus-visible]:outline-[#8062d6] [&_button:focus-visible]:outline-offset-[5px] [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-[#8062d6] [&_a:focus-visible]:outline-offset-[5px] [&_select:focus-visible]:outline-[3px] [&_select:focus-visible]:outline-[#8062d6] [&_select:focus-visible]:outline-offset-[5px] motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none! motion-reduce:[&_*::after]:animate-none! motion-reduce:[&_*::after]:transition-none!",

  section,

  hero: "relative scroll-mt-20 overflow-clip bg-[linear-gradient(180deg,#f5f3ff_0%,#eff6ff_45%,#ffffff_100%)] px-6 pt-16 pb-0 text-center max-[700px]:px-5 max-[700px]:pt-11",

  eyebrow:
    "mt-0 mb-5 text-[11px] font-extrabold leading-[1.6] tracking-[0.16em] uppercase",

  heroTitle: `m-0 text-[clamp(42px,6.5vw,92px)] font-black leading-[0.95] tracking-[-0.075em] max-[700px]:text-[clamp(43px,11vw,72px)] ${gradientTitle}`,

  heroDescription:
    "mx-auto my-7 max-w-[580px] text-lg leading-[1.7] text-slate-500 max-[700px]:text-[15px]",

  actions,
  primaryButton,

  secondaryButton: `${button} border-current bg-transparent text-inherit hover:-translate-y-0.5`,

  textLink,
  finePrint,

  scene:
    "relative isolate mx-auto -mt-[82px] grid min-h-[590px] max-w-[1280px] place-items-center max-[700px]:min-h-[510px]",

  atmosphere: "pointer-events-none absolute inset-0 -z-10 h-full w-full",

  orbit: `${orbit} h-[330px] w-[min(850px,92%)] [transform:translate(-50%,-50%)_rotate(-12deg)] max-[700px]:h-[260px] max-[700px]:w-[115%]`,

  orbitInner: `${orbit} h-[420px] w-[min(700px,78%)] [transform:translate(-50%,-50%)_rotate(15deg)] max-[700px]:h-[360px] max-[700px]:w-[95%]`,

  heroObject:
    "w-[min(460px,calc(100vw_-_48px))] rounded-3xl border-0 bg-transparent p-0 text-left shadow-[0_35px_70px_#22251f20] [transform:perspective(900px)_rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))_rotate(-4deg)] transition-transform duration-[180ms] ease-out max-[700px]:w-[min(360px,calc(100vw_-_48px))] motion-reduce:[transform:rotate(-4deg)]",

  objectReveal:
    "animate-[home-object-reveal_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]",

  siteCard:
    "w-full min-w-0 text-left [&_[data-slot=card-header]>div>div:first-child]:min-w-0 [&_[data-slot=card-header]>div>div:first-child]:flex-1 [&_[data-slot=card-header]>div>div:last-child]:shrink-0 [&_[data-slot=card-title]]:whitespace-normal [&_[data-slot=card-title]]:[overflow-wrap:anywhere] [&_[data-slot=card-title]]:leading-[1.25] [&_[data-slot=card-footer]]:flex-wrap [&_[data-slot=card-footer]]:gap-3",

  sceneNote,

  noteLeft: "left-[12%] -rotate-[8deg] max-[1023px]:left-[4%]",

  noteRight: "right-[11%] rotate-[8deg] max-[1023px]:right-[4%]",

  sceneControls:
    "absolute right-4 bottom-6 left-4 [&_p]:mt-0 [&_p]:mb-3 [&_p]:text-xs",

  dots: "flex justify-center gap-0.5",

  dot: "grid size-11 place-items-center border-0 bg-transparent p-0 after:size-[9px] after:rounded-full after:bg-[#22251f35] after:content-[''] aria-pressed:after:scale-[1.3] aria-pressed:after:bg-violet-600",

  heroFooter:
    "mx-auto flex max-w-[1200px] justify-between gap-4 border-t border-[#22251f25] py-[22px] text-left text-xs [&_a]:font-extrabold max-[700px]:flex-col max-[700px]:items-center max-[700px]:text-center max-[700px]:text-[11px]",

  storyNavigation:
    "flex justify-center gap-8 overflow-x-auto border-b border-[#22251f25] px-[18px] py-[22px] text-xs font-extrabold [&_a]:shrink-0 [&_a]:py-2 max-[700px]:justify-start max-[700px]:gap-6",

  sectionHeading,

  collectionSection: "overflow-clip bg-slate-50",

  collectionStage:
    "relative mx-auto flex min-h-[260px] max-w-[1150px] justify-center gap-5 max-[1023px]:min-h-0 max-[1023px]:justify-start max-[1023px]:overflow-x-auto max-[1023px]:snap-x max-[1023px]:snap-mandatory max-[1023px]:scroll-px-2 max-[1023px]:px-2 max-[1023px]:pt-3 max-[1023px]:pb-6 motion-safe:lg:block motion-safe:lg:h-[280px] motion-reduce:min-h-0 motion-reduce:justify-start motion-reduce:overflow-x-auto motion-reduce:px-2 motion-reduce:pt-3 motion-reduce:pb-6",

  collectionCard:
    "w-80 shrink-0 self-start rounded-[22px] border-0 bg-transparent p-0 text-left shadow-[0_15px_30px_#22251f15] focus-visible:outline-none max-[1023px]:snap-center motion-safe:lg:absolute motion-safe:lg:left-1/2 motion-safe:lg:top-5 motion-safe:lg:[transform:translateX(-50%)_translateX(calc((var(--position)_-_(var(--count)_-_1)/2)*248px))_rotate(calc((var(--position)_-_(var(--count)_-_1)/2)*8deg))]",

  collectionHint: "mt-6 mb-0 text-center text-xs",

  sharingIllustration:
    "mx-auto mt-20 max-w-[1000px] border-t border-violet-200 pt-11 text-center max-[700px]:mt-12 max-[700px]:pt-10",

  shareIntro:
    "mx-auto mb-[34px] max-w-[610px] [&_h3]:mt-0 [&_h3]:mb-[18px] [&_h3]:text-[clamp(30px,4vw,48px)] [&_h3]:font-black [&_h3]:leading-[1.08] [&_h3]:tracking-[-0.045em] [&_h3]:text-violet-600 [&>p:last-child]:text-[15px] [&>p:last-child]:leading-[1.8] [&>p:last-child]:text-slate-500",

  shareExample:
    "mx-auto max-w-[440px] rounded-[28px] bg-[radial-gradient(ellipse_at_center,#ede9fe,transparent_75%)] p-6 [&>div]:-rotate-3 [&>div]:rounded-2xl [&>div]:shadow-[0_20px_45px_#8b5cf620] [&>p]:mt-6 max-[700px]:px-1",

  shareArrow: "mx-auto my-2 size-7 text-violet-400",

  shareDestinations:
    "mx-auto mb-[38px] grid max-w-[650px] grid-cols-2 gap-4 [&>div]:flex [&>div]:flex-col [&>div]:items-center [&>div]:gap-3 [&>div]:px-3 [&>div]:py-3.5 [&_svg]:size-14 [&_svg]:rounded-[18px] [&_svg]:bg-violet-100 [&_svg]:p-4 [&_svg]:text-violet-600 [&>div:nth-child(2)_svg]:bg-pink-100 [&>div:nth-child(2)_svg]:text-pink-600 [&>div:nth-child(3)_svg]:bg-green-100 [&>div:nth-child(3)_svg]:text-green-600 [&_strong]:text-[13px] [&_span]:text-xs [&_span]:text-slate-500 max-[700px]:gap-1 max-[700px]:[&>div]:px-0 max-[700px]:[&_strong]:text-[11px] max-[700px]:[&_span]:text-[10px]",

  gamesSection:
    "bg-[linear-gradient(180deg,#eff6ff,#f5f3ff)] text-center text-gray-700",

  cabinetStage:
    "mx-auto grid max-w-[1100px] grid-cols-2 gap-[38px] px-5 pt-[30px] pb-14 max-[700px]:grid-cols-1 max-[700px]:gap-[22px] max-[700px]:px-0 max-[700px]:pt-2 max-[700px]:pb-6",

  cabinetItem:
    "min-w-0 [transform:rotate(var(--cabinet-angle))] transition-transform duration-250 [&:nth-child(even)]:mt-[30px] [&>div]:text-left motion-safe:min-[701px]:hover:[transform:translateY(-8px)_rotate(0deg)] motion-safe:min-[701px]:focus-within:[transform:translateY(-8px)_rotate(0deg)] max-[700px]:transform-none max-[700px]:[&:nth-child(even)]:mt-0",

  cabinetLink: "block rounded-2xl text-left",

  gameCta: "mt-6",

  profileSection: "bg-sky-50",

  profilePreview: "mx-auto grid max-w-[1100px] gap-4 [&>div:last-child]:mt-6",

  profilePreviewLabel: "m-0 text-xs font-bold text-slate-500",

  profileAchievementGrid:
    "grid grid-cols-3 gap-3 max-[1023px]:grid-cols-2 max-[640px]:grid-cols-1",

  profileSharePrompt:
    "m-4 flex max-w-[240px] shrink-0 items-start gap-2.5 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-violet-600 no-underline transition-[background,box-shadow] duration-[180ms] hover:bg-violet-100 hover:shadow-[0_4px_16px_#7c3aed15] focus-visible:outline-[3px] focus-visible:outline-violet-600 focus-visible:outline-offset-[3px] [&>svg]:size-6 [&>svg]:shrink-0 [&>span]:flex [&>span]:flex-col [&>span]:gap-[5px] [&_strong]:text-[13px] [&_strong]:leading-[1.3] [&>span>span]:text-xs [&>span>span]:leading-[1.5] [&>span>span]:text-slate-500 max-[700px]:mx-2 max-[700px]:my-3 max-[700px]:max-w-11 max-[700px]:p-2.5 max-[700px]:[&>svg]:size-[22px] max-[700px]:[&>span]:sr-only",

  packsSection: "text-center",

  packList: "mx-auto mb-6 grid max-w-[950px] gap-5 text-left",

  subscriptionSection:
    "bg-[linear-gradient(135deg,#ede9fe,#e0f2fe,#ffffff)] text-center",

  subscriptionTitle: `m-0 text-[clamp(30px,5.5vw,64px)] font-black leading-[0.97] tracking-[-0.065em] ${gradientTitle}`,

  subscriptionDescription:
    "mx-auto mt-[26px] mb-[34px] max-w-[500px] text-base leading-[1.6]",

  segmented:
    "flex gap-1 rounded-full border border-violet-100 bg-[#f3f0ff] p-1.5 [&_button]:min-h-11 [&_button]:min-w-0 [&_button]:flex-1 [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-xs [&_button]:font-extrabold [&_button]:leading-[1.4] [&_button]:text-slate-500 [&_button]:transition-[background,color,box-shadow] [&_button]:duration-[180ms] [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:text-violet-600 [&_button[aria-pressed=true]]:shadow-[0_2px_8px_#8b5cf620]",

  planBadge:
    "mt-0 mb-6 inline-flex rounded-full bg-[linear-gradient(100deg,#7c3aed,#3b82f6)] px-4 py-2 text-[11px] font-extrabold tracking-[0.08em] text-white uppercase shadow-[0_4px_14px_#8b5cf625]",

  plan: "mx-auto max-w-[410px] rounded-3xl border border-violet-300 bg-white p-7 shadow-[0_18px_45px_#8b5cf625] [&>a]:w-full max-[700px]:p-6",

  price:
    "my-7 flex items-baseline justify-center gap-1.5 [&_strong]:text-[44px] [&_strong]:font-black [&_strong]:leading-none [&_strong]:tracking-[-0.065em] [&_span]:text-sm max-[700px]:[&_strong]:text-[58px]",

  planFeatures:
    "mt-0 mb-7 grid list-none gap-2.5 p-0 text-left text-[13px] [&_li]:before:mr-2.5 [&_li]:before:font-black [&_li]:before:text-violet-600 [&_li]:before:content-['✓']",

  finalClaim:
    "mx-auto mt-[40px] [&_p]:mb-[18px] [&_p]:text-lg [&_p]:font-extrabold text-grey-700",
} as const;

export default homeStyles;

"use client";

import type { Achievement } from "@/lib/supabase";
import styles from "@/components/home/home-styles";
import { useCardFace } from "./use-card-face";

const RARITY_CHIPS = [
  { label: "Common", className: "bg-slate-200 text-slate-700" },
  { label: "Rare", className: "bg-blue-500 text-white" },
  { label: "Epic", className: "bg-violet-500 text-white" },
  { label: "Legendary", className: "bg-amber-400 text-amber-950" },
];

// Every beat's picture gets the same box, so the three cards line up.
const VISUAL = "flex w-20 shrink-0 items-center justify-center";

export function HowItWorks({ sample }: { sample: Achievement | undefined }) {
  const face = useCardFace(sample);

  return (
    <section
      id="how-it-works"
      className="bg-white px-5 py-16 md:px-8 md:py-16"
      data-story-reveal
    >
      <div className="mx-auto max-w-[1040px]">
        <h2 className="mx-auto mb-10 max-w-[620px] text-center text-[clamp(30px,5vw,52px)] font-black leading-[1.02] tracking-[-0.06em] text-gray-800">
          Claim it. Collect it. Share it.
        </h2>

        <ol className="mx-auto my-0 grid max-w-[640px] list-none gap-4 p-0 lg:max-w-none lg:grid-cols-3">
          <li className="flex items-center gap-4 rounded-3xl bg-violet-50 p-5 ">
            <span className={VISUAL} aria-hidden="true">
              <span className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(100deg,#7c3aed,#3b82f6)] text-2xl text-white shadow-[0_8px_24px_#8b5cf630]">
                ↗
              </span>
            </span>
            <div>
              <h3 className="m-0 mb-1 text-lg font-extrabold text-gray-800">
                Claim
              </h3>
              <p className="m-0 text-sm leading-relaxed text-slate-600">
                One tap, one new achievement every day. No account needed.
              </p>
            </div>
          </li>

          <li className="flex items-center gap-4 rounded-3xl bg-sky-50 p-5 ">
            <span className={VISUAL} aria-hidden="true">
              <span className="flex flex-col gap-1">
                {RARITY_CHIPS.map((chip) => (
                  <span
                    key={chip.label}
                    className={`rounded-full px-2 py-0.5 text-center text-[9px] font-black uppercase tracking-wide ${chip.className}`}
                  >
                    {chip.label}
                  </span>
                ))}
              </span>
            </span>
            <div>
              <h3 className="m-0 mb-1 text-lg font-extrabold text-gray-800">
                Collect
              </h3>
              <p className="m-0 text-sm leading-relaxed text-slate-600">
                Common to Legendary. Make a free account to keep your streak and
                collection.
              </p>
            </div>
          </li>

          <li className="flex items-center gap-4 rounded-3xl bg-pink-50 p-5 ">
            <span className={VISUAL} aria-hidden="true">
              <span className="block w-16">
                {face ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL
                  <img
                    src={face.url}
                    alt=""
                    className="block aspect-[4/5] w-full -rotate-3 rounded-sm shadow-[0_10px_24px_-8px_#4c1d9566]"
                  />
                ) : (
                  <span className="block aspect-[4/5] w-full -rotate-3 rounded-sm bg-[linear-gradient(135deg,#7c3aed,#3b82f6)]" />
                )}
              </span>
            </span>
            <div>
              <h3 className="m-0 mb-1 text-lg font-extrabold text-gray-800">
                Share
              </h3>
              <p className="m-0 text-sm leading-relaxed text-slate-600">
                Every achievement becomes a ready-to-post image for Stories,
                chats or wherever.
              </p>
            </div>
          </li>
        </ol>

        <p className={`${styles.finePrint} mt-6 text-center`}>
          Ten free daily achievements. Unlimited with Pro.
        </p>
      </div>
    </section>
  );
}

import {
  glowClass,
  ClaimButton,
  type ClaimButtonProps,
} from "@/components/card-wall/wall-hero";

/**
 * The last Claim prompt. Claiming here reveals the card right here, zoomed
 * from this button; once claimed, the button reopens today's card.
 */
export function FinalCta(props: ClaimButtonProps) {
  const hasClaimed = props.claimState.claimed !== null;

  return (
    <section
      className={`${glowClass} box-border flex w-full max-w-[900px] flex-col items-center gap-7 px-6 py-[110px] text-center max-[720px]:py-20`}
      data-story-reveal
    >
      <h2 className="m-0 max-w-[640px] text-[clamp(30px,4.2vw,48px)] leading-none font-black tracking-[-0.04em] text-gray-800">
        {hasClaimed
          ? "Your achievement is waiting to be shown off."
          : "Today's achievement isn't going to claim itself."}
      </h2>
      <ClaimButton {...props} />
    </section>
  );
}

export default function DecorativeBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[8%] top-20 size-3 rotate-12 rounded-sm bg-yellow-300 sm:size-4" />
      <div className="absolute right-[10%] top-28 size-4 rotate-45 rounded-sm bg-violet-300 sm:size-5" />
      <div className="absolute bottom-[18%] left-[14%] size-3 rounded-full bg-blue-300" />
      <div className="absolute bottom-[20%] right-[14%] size-3 rounded-full bg-pink-300" />

      <div className="absolute left-1/2 top-12 size-72 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl sm:size-96" />
      <div className="absolute bottom-0 left-[10%] size-56 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute bottom-0 right-[10%] size-56 rounded-full bg-pink-400/10 blur-3xl" />
    </div>
  );
}

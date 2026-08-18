const DOS = [
  "Open with their problem, not your bio",
  "Name the outcome, not just the task",
  "Prove it — don't just claim it",
  "Remove their risk to hire you",
  "Keep it short enough to scan",
  "Close with one specific question",
];

const DONTS = [
  '"I am a [role] with X years..."',
  "Restating the whole job post",
  "Walls of text, no breaks",
  '"I would love the opportunity..."',
  "Fabricated stats or testimonials",
  '"Let\'s discuss" as a closer',
];

export default function Rulebook() {
  return (
    <aside className="font-mono text-[13px] leading-relaxed">
      <p className="text-gold/80 tracking-[0.2em] uppercase text-[11px] mb-4">
        What it never forgets
      </p>

      <div className="space-y-1.5">
        {DOS.map((rule) => (
          <div key={rule} className="flex gap-2 text-paper/85">
            <span className="text-moss shrink-0">✓</span>
            <span>{rule}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-paper/10 my-4" />

      <div className="space-y-1.5">
        {DONTS.map((rule) => (
          <div key={rule} className="flex gap-2 text-paper/50">
            <span className="text-seal shrink-0">✕</span>
            <span>{rule}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

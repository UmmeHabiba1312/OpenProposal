"use client";

import { KeyboardEvent, useState } from "react";

export default function SkillsInput({
  value,
  onChange,
}: {
  value: string; // comma-separated, stored as-is for the backend
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const skills = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function addSkill() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...skills, trimmed].join(", "));
    setDraft("");
  }

  function removeSkill(skill: string) {
    onChange(skills.filter((s) => s !== skill).join(", "));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && draft === "" && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  }

  return (
    <div className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-3 py-2.5 focus-within:border-gold/70 focus-within:ring-1 focus-within:ring-gold/40">
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 bg-gold/15 text-gold text-xs px-2.5 py-1 rounded-full"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="hover:text-paper"
              aria-label={`Remove ${skill}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addSkill}
          placeholder={skills.length === 0 ? "Type a skill, press Enter…" : "Add another…"}
          className="flex-1 min-w-[120px] bg-transparent text-sm placeholder:text-paper/30 focus:outline-none py-1"
        />
      </div>
    </div>
  );
}
export type PasswordCheck = {
  label: string;
  passed: boolean;
};

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "One number", passed: /[0-9]/.test(password) },
    { label: "One symbol", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  const checks = getPasswordChecks(password);
  const score = checks.filter((c) => c.passed).length;

  if (password.length === 0) return { score: 0, label: "", color: "bg-paper/10" };
  if (score <= 1) return { score, label: "Weak", color: "bg-seal" };
  if (score === 2 || score === 3) return { score, label: "Okay", color: "bg-gold" };
  return { score, label: "Strong", color: "bg-moss" };
}
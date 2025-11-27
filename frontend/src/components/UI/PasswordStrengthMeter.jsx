import React, { useEffect, useMemo } from "react";
import zxcvbn from "zxcvbn";

const LEVELS = [
  { label: "Weak", barClass: "bg-red-500", textClass: "text-red-300" },
  { label: "Weak", barClass: "bg-red-500", textClass: "text-red-300" },
  { label: "Medium", barClass: "bg-orange-400", textClass: "text-orange-300" },
  { label: "Strong", barClass: "bg-green-400", textClass: "text-green-300" },
  { label: "Very Strong", barClass: "bg-emerald-500", textClass: "text-emerald-300" }
];

export default function PasswordStrengthMeter({ password = "", onFeedback }) {
  const analysis = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  const score = analysis ? Math.min(Math.max(analysis.score, 0), 4) : 0;
  const level = LEVELS[score];
  const progressPercent = password ? ((score + 1) / LEVELS.length) * 100 : 0;

  const suggestions = useMemo(() => {
    if (!password) return [];
    const tips = [];
    if (analysis?.feedback?.warning) tips.push(analysis.feedback.warning);
    if (Array.isArray(analysis?.feedback?.suggestions)) {
      tips.push(
        ...analysis.feedback.suggestions.filter((tip) => typeof tip === "string" && tip.trim().length)
      );
    }
    if (!tips.length) {
      tips.push("Use a longer passphrase with letters, numbers, and symbols.");
    }
    return tips.slice(0, 3);
  }, [analysis, password]);

  useEffect(() => {
    if (typeof onFeedback === "function") {
      onFeedback({
        score,
        label: password ? level.label : null,
        suggestions
      });
    }
  }, [level.label, onFeedback, password, score, suggestions]);

  return (
    <div className="mt-2 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Password strength</span>
        <span className={`font-semibold ${level.textClass}`}>{password ? level.label : "—"}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${level.barClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {password && suggestions.length > 0 && (
        <ul className="list-disc list-inside text-gray-200 space-y-1">
          {suggestions.map((tip, index) => (
            <li key={`${tip}-${index}`}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

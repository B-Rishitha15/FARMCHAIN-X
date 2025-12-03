import React from 'react';

const clampScore = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

const AiScoreGauge = ({ score, size = 140, label = 'AI Score' }) => {
  const normalized = clampScore(score);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  const hue = (normalized / 100) * 120; // 0 => red, 120 => green
  const color = `hsl(${hue}, 70%, 45%)`;

  return (
    <div className="flex flex-col items-center space-y-3">
      <svg width={size} height={size} className="drop-shadow-sm">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-300 ease-out"
        />
        <text
          x="50%"
          y="45%"
          textAnchor="middle"
          className="text-lg font-semibold fill-gray-900 dark:fill-white"
        >
          {Math.round(normalized)}
        </text>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          className="text-xs uppercase tracking-wide fill-gray-500 dark:fill-gray-300"
        >
          / 100
        </text>
      </svg>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </div>
    </div>
  );
};

export default AiScoreGauge;





import React from "react";

interface BarChartProps {
  data: number[];
  labels: string[];
  height?: number;
  className?: string;
}

export function BarChart({
  data,
  labels,
  height = 200,
  className = "",
}: BarChartProps) {
  const maxValue = Math.max(...data);

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <div className="flex h-full">
        {data.map((value, index) => {
          const percentage = (value / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-end flex-1 gap-2"
            >
              <div className="relative w-full px-1">
                <div
                  className="w-full bg-teal-500 dark:bg-teal-600 rounded-t-sm"
                  style={{ height: `${percentage}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {value}
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {labels[index]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: number[];
  labels: string[];
  height?: number;
  className?: string;
}

export function LineChart({
  data,
  labels,
  height = 200,
  className = "",
}: LineChartProps) {
  const maxValue = Math.max(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <div className="relative h-full">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="#14b8a6"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between">
          {labels.map((label, index) => (
            <div
              key={index}
              className="text-xs text-slate-500 dark:text-slate-400"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PieChartProps {
  data: number[];
  labels: string[];
  colors: string[];
  className?: string;
}

export function PieChart({
  data,
  labels,
  colors,
  className = "",
}: PieChartProps) {
  const total = data.reduce((acc, curr) => acc + curr, 0);
  let cumulativePercentage = 0;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((value, index) => {
            const percentage = (value / total) * 100;
            const startAngle = cumulativePercentage * 3.6; // 3.6 = 360 / 100
            cumulativePercentage += percentage;
            const endAngle = cumulativePercentage * 3.6;

            // Calculate the SVG arc path
            const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
            const largeArcFlag = percentage > 50 ? 1 : 0;

            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index]}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>

      <div className="ml-6 space-y-2">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors[index] }}
            ></div>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              {label} ({Math.round((data[index] / total) * 100)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

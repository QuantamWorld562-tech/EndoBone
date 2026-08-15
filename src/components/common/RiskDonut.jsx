export default function RiskDonut({
  value = 0,
  label = '',
  color = '#ef4444',
  subColor = 'text-red-600',
  size = 200,
  stroke = 14,
  subtitle,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value)) / 100;
  const dashOffset = circumference * (1 - progress);
  const riskLabel =
    value >= 70 ? 'High Risk' : value >= 40 ? 'Moderate Risk' : value >= 20 ? 'Low-Moderate' : 'Low';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-black tracking-tight ${subColor}`}>{value}%</div>
          <div className={`mt-1 text-sm font-bold ${subColor}`}>{riskLabel}</div>
        </div>
      </div>
      <div className="mt-6 w-full max-w-[240px] text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${color.replace('text-', 'bg-')}`}
            style={{ background: color.startsWith('#') ? color : undefined }}
          />
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{label}</h3>
        </div>
        {subtitle && <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}

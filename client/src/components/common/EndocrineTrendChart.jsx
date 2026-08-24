import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';

export default function EndocrineTrendChart({
  biomarkers = {},
  className = '',
}) {
  const [activeHoverIdx, setActiveHoverIdx] = useState(null);

  const parseVal = (val, fallback) => {
    if (val === '' || val === null || val === undefined) return fallback;
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : fallback;
  };

  // Extract current biomarker values with safe fallbacks
  const currentPth = parseVal(biomarkers?.pth?.value, 72);
  const currentVitD = parseVal(biomarkers?.vitaminD?.value, 28);
  const currentCtx = parseVal(biomarkers?.ctx?.value, 380);
  const currentAlp = parseVal(biomarkers?.alp?.value, 112);

  // Generate 6-point clinical trend trajectory leading up to current pre-op lab
  const timelineData = useMemo(() => {
    const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Oct (Pre-Op)'];
    
    // Simulate physiological trajectory converging on the patient's current values
    return months.map((month, i) => {
      const isLatest = i === months.length - 1;
      const factor = (i + 1) / months.length;
      
      // CTX-I trajectory
      const ctxVal = isLatest ? currentCtx : Math.round(currentCtx * (0.65 + factor * 0.35) + (Math.sin(i) * 15));
      // ALP trajectory
      const alpVal = isLatest ? currentAlp : Math.round(currentAlp * (0.80 + factor * 0.20) + (Math.cos(i) * 8));
      // PTH trajectory
      const pthVal = isLatest ? currentPth : Math.round(currentPth * (0.70 + factor * 0.30) + (Math.sin(i * 1.5) * 6));
      // Vitamin D trajectory (inverse to PTH)
      const vitDVal = isLatest ? currentVitD : Math.round(Math.max(12, currentVitD * (1.35 - factor * 0.35) + (Math.cos(i * 1.2) * 3)));

      return {
        month,
        ctx: ctxVal,
        alp: alpVal,
        pth: pthVal,
        vitD: vitDVal,
        isLatest,
      };
    });
  }, [currentPth, currentVitD, currentCtx, currentAlp]);

  // SVG dimensions for compact charts
  const width = 320;
  const height = 110;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const baselineY = padding.top + plotH;

  /**
   * Smooth Cubic Spline (Catmull-Rom / Hermite interpolation)
   * Generates organic, continuous silky smooth curves through every data point
   */
  const makeSmoothSplinePath = (pts, tension = 0.28) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

    let path = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[0];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;

      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }

    return path;
  };

  const makeSmoothAreaPath = (pts, baseY, tension = 0.28) => {
    if (!pts || pts.length === 0) return '';
    const linePath = makeSmoothSplinePath(pts, tension);
    const lastPt = pts[pts.length - 1];
    const firstPt = pts[0];
    return `${linePath} L ${lastPt.x.toFixed(2)},${baseY.toFixed(2)} L ${firstPt.x.toFixed(2)},${baseY.toFixed(2)} Z`;
  };

  // Helper to calculate SVG points for Chart 1 (Turnover Markers: CTX-I & ALP)
  const chart1Points = useMemo(() => {
    const maxVal = Math.max(500, ...timelineData.map(d => Math.max(d.ctx, d.alp)));
    const getX = (idx) => padding.left + (idx / (timelineData.length - 1)) * plotW;
    const getY = (val) => padding.top + plotH - (val / maxVal) * plotH;

    const ctxPoints = timelineData.map((d, i) => ({ x: getX(i), y: getY(d.ctx), val: d.ctx }));
    const alpPoints = timelineData.map((d, i) => ({ x: getX(i), y: getY(d.alp), val: d.alp }));

    return {
      ctxPath: makeSmoothSplinePath(ctxPoints),
      ctxArea: makeSmoothAreaPath(ctxPoints, baselineY),
      alpPath: makeSmoothSplinePath(alpPoints),
      alpArea: makeSmoothAreaPath(alpPoints, baselineY),
      ctxPoints,
      alpPoints,
      maxVal,
    };
  }, [timelineData, plotW, plotH, padding.left, padding.top, baselineY]);

  // Helper to calculate SVG points for Chart 2 (Hormonal Axis: PTH vs Vitamin D)
  const chart2Points = useMemo(() => {
    const maxPth = Math.max(100, ...timelineData.map(d => d.pth));
    const maxVitD = 60;
    const getX = (idx) => padding.left + (idx / (timelineData.length - 1)) * plotW;
    const getYPth = (val) => padding.top + plotH - (val / maxPth) * plotH;
    const getYVitD = (val) => padding.top + plotH - (val / maxVitD) * plotH;

    const pthPoints = timelineData.map((d, i) => ({ x: getX(i), y: getYPth(d.pth), val: d.pth }));
    const vitDPoints = timelineData.map((d, i) => ({ x: getX(i), y: getYVitD(d.vitD), val: d.vitD }));

    return {
      pthPath: makeSmoothSplinePath(pthPoints),
      pthArea: makeSmoothAreaPath(pthPoints, baselineY),
      vitDPath: makeSmoothSplinePath(vitDPoints),
      vitDArea: makeSmoothAreaPath(vitDPoints, baselineY),
      pthPoints,
      vitDPoints,
    };
  }, [timelineData, plotW, plotH, padding.left, padding.top, baselineY]);

  const activePoint = activeHoverIdx !== null ? timelineData[activeHoverIdx] : timelineData[timelineData.length - 1];

  return (
    <div className={`space-y-3 text-slate-100 min-w-0 max-w-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400 shrink-0" />
          <h4 className="text-xs font-black text-slate-200 tracking-wider uppercase truncate">
            Endocrine Profile &amp; Biomarkers
          </h4>
        </div>
        <span className="text-[10px] text-slate-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shrink-0">
          PowerBI Analytics
        </span>
      </div>

      {/* Chart 1: Serum Bone Markers (Turnover: ALP vs CTX-I) */}
      <div className="bg-slate-950/90 rounded-xl border border-slate-800/80 p-3 space-y-2 shadow-inner min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] min-w-0">
          <span className="font-bold text-slate-300 truncate max-w-[140px] sm:max-w-none">1. Bone Turnover Markers</span>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold shrink-0">
            <span className="flex items-center gap-1 text-cyan-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              ALP ({activePoint.alp} U/L)
            </span>
            <span className="flex items-center gap-1 text-amber-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              CTX-I ({activePoint.ctx} pg/mL)
            </span>
          </div>
        </div>

        {/* SVG Chart 1 */}
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-hidden select-none block">
            <defs>
              <linearGradient id="alpGlowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="ctxGlowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={padding.left + plotW} y2={padding.top} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + plotH / 2} x2={padding.left + plotW} y2={padding.top + plotH / 2} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#334155" />

            {/* Glowing Area Fills */}
            <path d={chart1Points.alpArea} fill="url(#alpGlowGrad)" />
            <path d={chart1Points.ctxArea} fill="url(#ctxGlowGrad)" />

            {/* Smooth Curves */}
            <path d={chart1Points.alpPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
            <path d={chart1Points.ctxPath} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />

            {/* Interactive Data Dots */}
            {chart1Points.alpPoints.map((pt, idx) => (
              <circle
                key={`alp-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={activeHoverIdx === idx || (activeHoverIdx === null && idx === timelineData.length - 1) ? 4.5 : 2.5}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              />
            ))}
            {chart1Points.ctxPoints.map((pt, idx) => (
              <circle
                key={`ctx-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={activeHoverIdx === idx || (activeHoverIdx === null && idx === timelineData.length - 1) ? 4.5 : 2.5}
                fill="#fbbf24"
                stroke="#0f172a"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              />
            ))}

            {/* X-Axis Labels */}
            {timelineData.map((d, idx) => {
              const x = padding.left + (idx / (timelineData.length - 1)) * plotW;
              return (
                <text
                  key={`lbl-${idx}`}
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  fill={d.isLatest ? '#7dd3fc' : '#64748b'}
                  fontSize="8"
                  fontWeight={d.isLatest ? 'bold' : 'normal'}
                >
                  {d.month.split(' ')[0]}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Chart 2: Hormonal Axis Profile (PTH vs Vitamin D) */}
      <div className="bg-slate-950/90 rounded-xl border border-slate-800/80 p-3 space-y-2 shadow-inner min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] min-w-0">
          <span className="font-bold text-slate-300 truncate max-w-[140px] sm:max-w-none">2. Hormonal Profile Axis</span>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold shrink-0">
            <span className="flex items-center gap-1 text-amber-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              PTH ({activePoint.pth} pg/mL)
            </span>
            <span className="flex items-center gap-1 text-teal-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
              25(OH)D ({activePoint.vitD} ng/mL)
            </span>
          </div>
        </div>

        {/* SVG Chart 2 */}
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-hidden select-none block">
            <defs>
              <linearGradient id="pthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="vitDAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={padding.left + plotW} y2={padding.top} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + plotH / 2} x2={padding.left + plotW} y2={padding.top + plotH / 2} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#334155" />

            {/* Area Fills */}
            <path d={chart2Points.pthArea} fill="url(#pthAreaGrad)" />
            <path d={chart2Points.vitDArea} fill="url(#vitDAreaGrad)" />

            {/* Smooth Curves */}
            <path d={chart2Points.pthPath} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <path d={chart2Points.vitDPath} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />

            {/* Interactive Data Dots */}
            {chart2Points.pthPoints.map((pt, idx) => (
              <circle
                key={`pth-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={activeHoverIdx === idx || (activeHoverIdx === null && idx === timelineData.length - 1) ? 4.5 : 2.5}
                fill="#fbbf24"
                stroke="#0f172a"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              />
            ))}
            {chart2Points.vitDPoints.map((pt, idx) => (
              <circle
                key={`vitd-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={activeHoverIdx === idx || (activeHoverIdx === null && idx === timelineData.length - 1) ? 4.5 : 2.5}
                fill="#2dd4bf"
                stroke="#0f172a"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              />
            ))}

            {/* X-Axis Labels */}
            {timelineData.map((d, idx) => {
              const x = padding.left + (idx / (timelineData.length - 1)) * plotW;
              return (
                <text
                  key={`lbl2-${idx}`}
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  fill={d.isLatest ? '#5eead4' : '#64748b'}
                  fontSize="8"
                  fontWeight={d.isLatest ? 'bold' : 'normal'}
                >
                  {d.month.split(' ')[0]}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400 leading-tight">
          <Info size={11} className="text-cyan-400 shrink-0" />
          <span className="truncate">Inverse Axis: PTH ({currentPth} pg/mL) vs Vit D ({currentVitD} ng/mL).</span>
        </div>
      </div>
    </div>
  );
}

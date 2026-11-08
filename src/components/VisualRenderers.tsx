import React from 'react';
import {
  GameId,
  MatrixCellSpec,
  PaperFoldSpec,
  SpatialPolyominoSpec,
} from '../domain/types';

export const GameIcon: React.FC<{ gameId: GameId; className?: string }> = ({
  gameId,
  className = 'w-6 h-6',
}) => {
  switch (gameId) {
    case 'number-sequence':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M4 17l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 8h4v4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="17" r="1.5" fill="currentColor" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="13" cy="16" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'pattern-matrix':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M17.5 14v7M14 17.5h7" strokeLinecap="round" />
        </svg>
      );
    case 'word-connections':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="12" cy="18" r="3" />
          <path d="M8.7 7.5L10.8 15.2M15.3 7.5L13.2 15.2M9 6h6" strokeLinecap="round" />
        </svg>
      );
    case 'lateral-thinking':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.5 1 2.5h6c0-1 .3-1.9 1-2.5A6 6 0 0 0 12 3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'logic-detective':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          <path d="M5 5l2 2m0-2L5 7M11 11l2 2" strokeLinecap="round" />
        </svg>
      );
    case 'odd-one-out':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <polygon points="18,15 21,20.5 15,20.5" fill="currentColor" />
        </svg>
      );
    case 'math-mystery':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M5 8h6M8 5v6M14 8h5M5 17l5-5M10 17l-5-5M14 15h5M14 18h5" strokeLinecap="round" />
        </svg>
      );
    case 'memory-master':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="4" y="4" width="6" height="6" rx="1" fill="currentColor" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" fill="currentColor" />
        </svg>
      );
    case 'spatial-intelligence':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" strokeLinejoin="round" />
          <path d="M12 22V12M12 12l9-5M12 12L3 7" strokeLinejoin="round" />
        </svg>
      );
    case 'mind-investigator':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" strokeLinecap="round" />
          <path d="M8.5 11h5M11 8.5v5" strokeLinecap="round" />
        </svg>
      );
  }
};

function regularPolygonPoints(sides: number, cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export const MatrixCellRenderer: React.FC<{
  cell: MatrixCellSpec | null;
  size?: number;
  isPreview?: boolean;
}> = ({ cell, size = 96, isPreview = false }) => {
  if (!cell) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-400 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 font-mono text-xl font-bold"
      >
        ?
      </div>
    );
  }

  const patternId = `stripe-${cell.outerShape}-${cell.rotation}-${cell.dots}`;
  const r = 34 * (cell.scale || 0.85);

  const getFillValue = () => {
    switch (cell.fill) {
      case 'solid':
        return 'currentColor';
      case 'tinted':
        return 'rgba(99, 102, 241, 0.22)';
      case 'duotone':
        return 'rgba(16, 185, 129, 0.25)';
      case 'striped':
        return `url(#${patternId})`;
      case 'outline':
      default:
        return 'none';
    }
  };

  const renderOuterShape = () => {
    const fillVal = getFillValue();
    const commonProps = {
      fill: fillVal,
      stroke: 'currentColor',
      strokeWidth: 2.6,
      strokeLinejoin: 'round' as const,
    };

    switch (cell.outerShape) {
      case 'circle':
        return <circle cx="50" cy="50" r={r} {...commonProps} />;
      case 'square':
        return <rect x={50 - r} y={50 - r} width={r * 2} height={r * 2} rx="4" {...commonProps} />;
      case 'diamond':
        return <polygon points={`50,${50 - r} ${50 + r},50 50,${50 + r} ${50 - r},50`} {...commonProps} />;
      case 'triangle':
        return <polygon points={regularPolygonPoints(3, 50, 50, r * 1.08)} {...commonProps} />;
      case 'pentagon':
        return <polygon points={regularPolygonPoints(5, 50, 50, r * 1.05)} {...commonProps} />;
      case 'hexagon':
        return <polygon points={regularPolygonPoints(6, 50, 50, r * 1.05)} {...commonProps} />;
      case 'star':
        return <polygon points={starPoints(50, 50, r * 1.1, r * 0.48)} {...commonProps} />;
      case 'cross': {
        const w = r * 0.42;
        return (
          <path
            d={`M ${50 - w} ${50 - r} H ${50 + w} V ${50 - w} H ${50 + r} V ${50 + w} H ${50 + w} V ${50 + r} H ${50 - w} V ${50 + w} H ${50 - r} V ${50 - w} H ${50 - w} Z`}
            {...commonProps}
          />
        );
      }
    }
  };

  const renderInnerMotif = () => {
    const ir = 11;
    switch (cell.innerShape) {
      case 'circle':
        return <circle cx="50" cy="50" r={ir} fill="none" stroke="currentColor" strokeWidth="2" />;
      case 'ring':
        return (
          <>
            <circle cx="50" cy="50" r={ir + 3} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r={ir - 3} fill="none" stroke="currentColor" strokeWidth="1.8" />
          </>
        );
      case 'square':
        return <rect x={50 - ir} y={50 - ir} width={ir * 2} height={ir * 2} fill="none" stroke="currentColor" strokeWidth="2" />;
      case 'triangle':
        return <polygon points={regularPolygonPoints(3, 50, 50, ir * 1.2)} fill="none" stroke="currentColor" strokeWidth="2" />;
      case 'cross':
        return <path d={`M ${50 - ir} 50 H ${50 + ir} M 50 ${50 - ir} V ${50 + ir}`} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />;
      case 'dot':
        return <circle cx="50" cy="50" r="4" fill="currentColor" />;
      case 'none':
      default:
        return null;
    }
  };

  const renderDots = () => {
    const count = cell.dots || 0;
    if (count <= 0) return null;
    const positions: [number, number][] =
      count === 1
        ? [[50, 22]]
        : count === 2
        ? [[36, 22], [64, 22]]
        : count === 3
        ? [[34, 22], [50, 22], [66, 22]]
        : count === 4
        ? [[34, 22], [50, 22], [66, 22], [50, 78]]
        : [[32, 22], [50, 22], [68, 22], [38, 78], [62, 78]];

    return positions.map(([x, y], idx) => (
      <circle
        key={idx}
        cx={x}
        cy={y}
        r="3.2"
        className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
        strokeWidth="1"
      />
    ));
  };

  const renderLinesMask = () => {
    const m = cell.linesMask || 0;
    if (!m) return null;
    return (
      <g className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="2.4" strokeLinecap="round">
        {(m & 1) !== 0 && <line x1="50" y1="50" x2="50" y2="8" />}
        {(m & 2) !== 0 && <line x1="50" y1="50" x2="92" y2="50" />}
        {(m & 4) !== 0 && <line x1="50" y1="50" x2="50" y2="92" />}
        {(m & 8) !== 0 && <line x1="50" y1="50" x2="8" y2="50" />}
      </g>
    );
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-xl border transition-all ${
        isPreview
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
        <defs>
          <pattern id={patternId} width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.45" />
          </pattern>
        </defs>
        {renderLinesMask()}
        <g transform={`rotate(${cell.rotation} 50 50)`}>{renderOuterShape()}</g>
        <g className="text-indigo-600 dark:text-indigo-400">{renderInnerMotif()}</g>
        {renderDots()}
      </svg>
      <span className="absolute bottom-1 right-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
        {cell.rotation}°
      </span>
    </div>
  );
};

export const OddShapeRenderer: React.FC<{
  sides: number;
  rotation: number;
  filled: boolean;
  innerDots: number;
}> = ({ sides, rotation, filled, innerDots }) => {
  const dotPositions: [number, number][] = [];
  for (let i = 0; i < innerDots; i++) {
    const angle = (i * 2 * Math.PI) / Math.max(1, innerDots);
    const rad = innerDots === 1 ? 0 : 12;
    dotPositions.push([50 + rad * Math.cos(angle), 50 + rad * Math.sin(angle)]);
  }

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16 text-slate-800 dark:text-slate-100 shrink-0">
      <g transform={`rotate(${rotation} 50 50)`}>
        <polygon
          points={regularPolygonPoints(sides, 50, 50, 34)}
          fill={filled ? 'rgba(99, 102, 241, 0.2)' : 'none'}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
      {dotPositions.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" className="fill-indigo-600 dark:fill-indigo-400" />
      ))}
    </svg>
  );
};

export const PolyominoGridRenderer: React.FC<{
  spec: SpatialPolyominoSpec;
  size?: number;
}> = ({ spec, size = 104 }) => {
  const activeSet = new Set(spec.cells.map(([x, y]) => `${x},${y}`));
  const accentKey = `${spec.accentCell[0]},${spec.accentCell[1]}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 p-2"
    >
      {Array.from({ length: 4 }).map((_, y) =>
        Array.from({ length: 4 }).map((__, x) => {
          const key = `${x},${y}`;
          const isActive = activeSet.has(key);
          const isAccent = key === accentKey;
          return (
            <g key={key}>
              <rect
                x={x * 23 + 4}
                y={y * 23 + 4}
                width={20}
                height={20}
                rx={3}
                className={
                  isAccent
                    ? 'fill-amber-500 stroke-amber-600'
                    : isActive
                    ? 'fill-indigo-600 dark:fill-indigo-500 stroke-indigo-700 dark:stroke-indigo-400'
                    : 'fill-slate-200/60 dark:fill-slate-800/50 stroke-slate-300/50 dark:stroke-slate-800'
                }
                strokeWidth="1.2"
              />
              {isAccent && (
                <circle cx={x * 23 + 14} cy={y * 23 + 14} r="3.5" fill="white" />
              )}
            </g>
          );
        })
      )}
    </svg>
  );
};

export const PaperFoldGridRenderer: React.FC<{
  punches: [number, number][];
  folds?: PaperFoldSpec['folds'];
  size?: number;
}> = ({ punches, folds = [], size = 104 }) => {
  const punchSet = new Set(punches.map(([x, y]) => `${x},${y}`));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2"
    >
      {/* Crease lines */}
      {folds.includes('left-to-right') || folds.includes('right-to-left') ? (
        <line x1="50" y1="4" x2="50" y2="96" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
      ) : null}
      {folds.includes('top-to-bottom') || folds.includes('bottom-to-top') ? (
        <line x1="4" y1="50" x2="96" y2="50" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
      ) : null}
      {folds.includes('diag-main') ? (
        <line x1="4" y1="4" x2="96" y2="96" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
      ) : null}

      {Array.from({ length: 4 }).map((_, y) =>
        Array.from({ length: 4 }).map((__, x) => {
          const hasHole = punchSet.has(`${x},${y}`);
          return (
            <g key={`${x},${y}`}>
              <rect
                x={x * 23 + 4}
                y={y * 23 + 4}
                width={20}
                height={20}
                rx={2.5}
                className="fill-stone-100/70 dark:fill-slate-800/60 stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1"
              />
              {hasHole && (
                <circle
                  cx={x * 23 + 14}
                  cy={y * 23 + 14}
                  r="5.5"
                  className="fill-indigo-600 dark:fill-indigo-400"
                />
              )}
            </g>
          );
        })
      )}
    </svg>
  );
};

import { useEffect, useMemo, useState } from 'react';
import type { DemoProps } from './types';

const MIN_LR = 0.04;
const MAX_LR = 0.48;
const INITIAL_THETA = 1.85;
const MAX_STEPS = 18;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function runGradientDescent(learningRate: number, steps: number) {
  let theta = INITIAL_THETA;
  const trajectory = [{ theta, loss: theta ** 2 }];

  for (let step = 0; step < steps; step += 1) {
    theta = theta - learningRate * 2 * theta;
    trajectory.push({ theta, loss: theta ** 2 });
  }

  return trajectory;
}

function toSvgPoint(theta: number, loss: number): { x: number; y: number } {
  const x = 54 + ((theta + 2.2) / 4.4) * 272;
  const y = 184 - Math.min(loss / 4.2, 1) * 136;
  return { x, y };
}

export default function GradientDescentDemo({
  title,
  description,
  autoplay,
  interactive,
}: DemoProps) {
  const [learningRate, setLearningRate] = useState(0.18);
  const [step, setStep] = useState(autoplay ? 4 : 0);
  const [playing, setPlaying] = useState(autoplay);

  const trajectory = useMemo(
    () => runGradientDescent(learningRate, MAX_STEPS),
    [learningRate]
  );

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= MAX_STEPS) {
          window.clearInterval(timer);
          return MAX_STEPS;
        }

        return current + 1;
      });
    }, 480);

    return () => window.clearInterval(timer);
  }, [playing, learningRate]);

  useEffect(() => {
    setStep((current) => clamp(current, 0, MAX_STEPS));
  }, [learningRate]);

  const visibleTrajectory = trajectory.slice(0, step + 1);
  const current = visibleTrajectory[visibleTrajectory.length - 1];
  const polylinePoints = visibleTrajectory
    .map(({ theta, loss }) => {
      const point = toSvgPoint(theta, loss);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const currentPoint = toSvgPoint(current.theta, current.loss);
  const lossCurvePath = 'M 46 184 C 92 132, 132 86, 190 56 C 236 38, 254 38, 330 184';

  return (
    <section className="demo-shell" data-demo-ready="true">
      <div className="demo-shell__header">
        <div>
          <p className="demo-shell__eyebrow">Interactive Demo</p>
          <h3 className="demo-shell__title">{title}</h3>
          <p className="demo-shell__description">{description}</p>
        </div>
        <div className="demo-shell__badge">
          <span>step {step}</span>
          <strong>loss {current.loss.toFixed(3)}</strong>
        </div>
      </div>

      <div className="demo-grid">
        <div className="demo-card">
          <svg
            viewBox="0 0 380 220"
            className="demo-chart"
            role="img"
            aria-label="梯度下降在抛物线上逐步靠近最小值"
          >
            <rect x="0" y="0" width="380" height="220" rx="24" fill="url(#demo-surface)" />
            <defs>
              <linearGradient id="demo-surface" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#eef2ff" />
              </linearGradient>
            </defs>
            <line x1="44" y1="184" x2="336" y2="184" stroke="#94a3b8" strokeWidth="2" />
            <line x1="190" y1="34" x2="190" y2="188" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6 8" />
            <path d={lossCurvePath} fill="none" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" />
            {visibleTrajectory.length > 1 ? (
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {visibleTrajectory.map(({ theta, loss }, index) => {
              const point = toSvgPoint(theta, loss);
              const active = index === visibleTrajectory.length - 1;
              return (
                <g key={`${theta}-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={active ? 7 : 4.5}
                    fill={active ? '#ea580c' : '#2563eb'}
                    opacity={active ? 1 : 0.72}
                  />
                </g>
              );
            })}
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r="12"
              fill="none"
              stroke="#fb923c"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="demo-chart__pulse"
            />
            <text x="190" y="204" textAnchor="middle" fontSize="14" fill="#475569">
              minimum at θ = 0
            </text>
          </svg>
        </div>

        <div className="demo-card demo-card--panel">
          <div className="demo-stats">
            <div>
              <span>θ</span>
              <strong>{current.theta.toFixed(3)}</strong>
            </div>
            <div>
              <span>η</span>
              <strong>{learningRate.toFixed(2)}</strong>
            </div>
            <div>
              <span>gradient</span>
              <strong>{(2 * current.theta).toFixed(3)}</strong>
            </div>
          </div>

          <label className="demo-control" htmlFor="learning-rate">
            <span>学习率</span>
            <input
              id="learning-rate"
              type="range"
              min={MIN_LR}
              max={MAX_LR}
              step="0.02"
              value={learningRate}
              disabled={!interactive}
              onChange={(event) => {
                setLearningRate(Number(event.target.value));
                setPlaying(false);
                setStep(0);
              }}
            />
          </label>

          <div className="demo-actions">
            <button
              type="button"
              onClick={() => setPlaying((currentPlaying) => !currentPlaying)}
              disabled={!interactive}
            >
              {playing ? '暂停' : '播放'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep(0);
              }}
              disabled={!interactive}
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep((currentStep) => clamp(currentStep + 1, 0, MAX_STEPS));
              }}
              disabled={!interactive}
            >
              单步
            </button>
          </div>

          <p className="demo-conclusion">
            学习率较小时，轨迹收敛更稳但更慢；学习率升高后，点会更快逼近最小值，也更容易出现振荡。
          </p>
        </div>
      </div>
    </section>
  );
}

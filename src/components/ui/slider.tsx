import { type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (v: number) => string;
}

export function Slider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  formatValue,
  ...rest
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-4 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div
          className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-foreground"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            className
          )}
          {...rest}
        />
      </div>
      {formatValue && (
        <span className="min-w-[3.5rem] text-right font-mono text-xs tabular-nums text-muted-foreground">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}
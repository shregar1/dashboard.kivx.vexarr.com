import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}

export function Switch({
  className,
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  size = 'md',
  ...rest
}: SwitchProps) {
  const trackSize = size === 'sm' ? 'h-3.5 w-6' : 'h-4 w-8';
  const thumbSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const thumbOffset = size === 'sm' ? (checked ? 'translate-x-2.5' : 'translate-x-0.5') : (checked ? 'translate-x-4' : 'translate-x-0.5');

  return (
    <label
      className={cn(
        'flex items-start gap-3',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center border border-foreground/30 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          trackSize,
          checked ? 'bg-foreground' : 'bg-secondary'
        )}
        {...rest}
      >
        <span
          className={cn(
            'pointer-events-none inline-block transform bg-foreground shadow-none ring-0 transition-transform',
            checked && 'bg-background',
            thumbSize,
            thumbOffset
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col gap-0.5 pt-0.5">
          {label && <span className="text-sm font-medium leading-none">{label}</span>}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
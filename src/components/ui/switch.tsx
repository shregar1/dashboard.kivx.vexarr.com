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
  const trackSize = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const thumbOffset = size === 'sm' ? (checked ? 'translate-x-3' : 'translate-x-0.5') : (checked ? 'translate-x-4' : 'translate-x-0.5');

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
          'relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          trackSize,
          checked ? 'bg-primary' : 'bg-muted'
        )}
        {...rest}
      >
        <span
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-background shadow ring-0 transition-transform',
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
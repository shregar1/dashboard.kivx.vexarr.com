import { type HTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export function Select({ className, options, placeholder, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-8 w-full appearance-none border border-input bg-background px-2.5 pr-7 text-sm',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-40',
          className
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function SelectOption({ className, ...rest }: HTMLAttributes<HTMLOptionElement>) {
  return <option className={cn('bg-background text-foreground', className)} {...rest} />;
}
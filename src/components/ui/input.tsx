import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...rest }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-8 w-full border border-input bg-background px-2.5 py-1 text-sm',
      'transition-colors placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-40',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
      className
    )}
    {...rest}
  />
));
Input.displayName = 'Input';
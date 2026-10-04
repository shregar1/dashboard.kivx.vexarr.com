import React, { useState, type FormEvent } from 'react';
import {
  Briefcase,
  FileText,
  Clipboard,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { ipc } from '@/lib/ipc';
import { useSetConfig } from '@/api/queries';
import { toast } from '@/stores/toast-store';

interface SessionWizardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type StepId = 'jd' | 'resume' | 'guidelines';

const STEPS: Array<{ id: StepId; title: string; description: string; placeholder: string; icon: typeof Briefcase }> = [
  {
    id: 'jd',
    title: 'Job description',
    description: 'Paste the role\'s JD — the engine uses it to tailor answers and follow-ups.',
    placeholder: 'Paste the full job description here…',
    icon: Briefcase
  },
  {
    id: 'resume',
    title: 'Your resume',
    description: 'Helps the engine pitch answers against your experience.',
    placeholder: 'Paste your resume (or key bullets) here…',
    icon: FileText
  },
  {
    id: 'guidelines',
    title: 'Guidelines',
    description: 'Optional house rules — what to say, what to avoid, format preferences.',
    placeholder: 'e.g. Always cite tradeoffs. Never invent libraries. Prefer bullet answers.',
    icon: Clipboard
  }
];

const MAX_LEN = 500_000;

/**
 * Isolated textarea wrapper.
 *
 * The wizard re-renders on every keystroke (controlled inputs always
 * do), and a bunch of parent hooks (TanStack Query mutations, the
 * useSetConfig mutation status, etc.) re-render with it. The default
 * React reconciler handles that fine — but the Dialog primitive
 * had a useEffect that ran `ref.current?.focus()` on the card div
 * to set up keyboard focus on open. If anything else in the parent
 * tree (or in React's effect ordering) ever caused that effect to
 * re-fire after the textarea was mounted, focus would jump out of
 * the textarea and into the card.
 *
 * Wrapping the textarea in its own component with a `key` keyed by
 * the step id gives us two guarantees:
 *   1. The textarea is fully remounted on step change, so the
 *      autoFocus + selection is always at the top.
 *   2. Between re-renders, the textarea is the *same* DOM element,
 *      so React preserves the user's cursor and IME composition.
 *
 * `React.memo` skips re-rendering this component when the parent's
 * other state (stepper, footer, character counter) changes — only
 * `value` and `onChange` matter to the textarea itself.
 */
const WizardTextarea = React.memo(function WizardTextarea({
  value,
  onChange,
  placeholder,
  maxLength
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={16}
      maxLength={maxLength}
      autoFocus
      spellCheck={false}
      className="min-h-[280px] font-mono text-xs"
    />
  );
});

export function SessionWizard({ open, onOpenChange }: SessionWizardProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [starting, setStarting] = useState(false);
  const setConfig = useSetConfig();

  const step = STEPS[stepIdx]!;
  const Icon = step.icon;
  const valueFor = (id: StepId) => (id === 'jd' ? jd : id === 'resume' ? resume : guidelines);
  const setValueFor = (id: StepId, v: string) => {
    if (id === 'jd') setJd(v);
    else if (id === 'resume') setResume(v);
    else setGuidelines(v);
  };
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;
  const value = valueFor(step.id);
  const canNext = step.id === 'guidelines' || value.trim().length > 0;

  function reset() {
    setStepIdx(0);
    setJd('');
    setResume('');
    setGuidelines('');
  }

  function close() {
    onOpenChange(false);
    // Defer reset so the user doesn't see the form clear during the close animation.
    window.setTimeout(reset, 200);
  }

  async function startSession() {
    setStarting(true);
    try {
      // 1. Persist the setup to the config so the next session picks it up.
      await setConfig.mutateAsync({
        sessionJD: jd.trim() || undefined,
        sessionResume: resume.trim() || undefined,
        sessionRules: guidelines.trim() || undefined
      });
      // 2. Fire the same IPC the in-call hotkey uses.
      await ipc.startSession();
      toast({
        variant: 'success',
        title: 'Session starting',
        description: 'Setup saved. The overlay should appear shortly.'
      });
      close();
    } catch (e) {
      toast({ variant: 'error', title: 'Could not start session', description: String(e) });
    } finally {
      setStarting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent size="xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center border border-border">
              <Icon className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Set up your session
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Step {stepIdx + 1} of {STEPS.length} — {step.title}
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Step strip */}
          <ol className="mb-4 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <li
                  key={s.id}
                  className={cn(
                    'flex flex-1 items-center gap-2 border px-3 py-2 text-xs',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : done
                        ? 'border-border bg-secondary text-foreground'
                        : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  <StepIcon className="size-3.5 shrink-0" />
                  <span className="font-medium uppercase tracking-wider">
                    {s.title}
                  </span>
                  {done && <Check className="ml-auto size-3.5" />}
                </li>
              );
            })}
          </ol>

          {/* Step body */}
          <p className="mb-2 text-sm text-muted-foreground">{step.description}</p>
          <WizardTextarea
            key={step.id}
            value={value}
            onChange={(v) => setValueFor(step.id, v)}
            placeholder={step.placeholder}
            maxLength={MAX_LEN}
          />
          <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
            <span>{step.id === 'guidelines' ? 'optional' : 'required'}</span>
            <span>{value.length.toLocaleString()} / {MAX_LEN.toLocaleString()}</span>
          </div>

          {/* Optional step indicator */}
          {step.id === 'guidelines' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <Sparkles className="size-3" /> optional
              </Badge>
              <span>You can add guidelines later from the session detail page.</span>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={starting}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft className="size-3" />}
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                  disabled={starting}
                >
                  Back
                </Button>
              )}
              {!isLast ? (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ChevronRight className="size-3" />}
                  onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                  disabled={!canNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={starting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  onClick={startSession}
                  loading={starting}
                >
                  Start session
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
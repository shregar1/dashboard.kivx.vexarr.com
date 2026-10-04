import { useState } from 'react';
import { Plus, Trash2, Star, FileText, Pencil, Check } from 'lucide-react';

import { Section, SectionRow } from '@/components/shared/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { useConfig, useSetConfig } from '@/api/queries';
import { promptTemplateSchema, type PromptTemplate } from '@/schemas/config';
import { toast } from '@/stores/toast-store';

export function PromptTemplatesPanel() {
  const config = useConfig();
  const setConfig = useSetConfig();
  const templates = (config.data?.promptTemplates ?? []) as PromptTemplate[];
  const activeId = config.data?.lastPromptTemplateId;
  const [selectedId, setSelectedId] = useState<string | null>(activeId ?? templates[0]?.id ?? null);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  function setActive(id: string) {
    setConfig.mutate({ lastPromptTemplateId: id });
  }

  function add() {
    const id = `template-${Date.now().toString(36)}`;
    const next: PromptTemplate = {
      id,
      name: 'New template',
      body: 'You are a helpful interview assistant.\n'
    };
    setConfig.mutate({ promptTemplates: [...templates, next], lastPromptTemplateId: id });
    setSelectedId(id);
  }

  function save(t: PromptTemplate) {
    const parsed = promptTemplateSchema.safeParse(t);
    if (!parsed.success) {
      toast({ variant: 'error', title: 'Invalid template' });
      return;
    }
    setConfig.mutate({
      promptTemplates: templates.map((x) => (x.id === t.id ? parsed.data : x))
    });
    toast({ variant: 'success', title: `Saved ${t.name}` });
  }

  function remove(id: string) {
    setConfig.mutate({ promptTemplates: templates.filter((t) => t.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Prompt templates"
        description="The system prompt prepended to every LLM call. Use placeholders like {{company}} and {{role}} for per-session context."
      >
        <SectionRow label="Templates" description="Active template is starred.">
          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No templates yet — add one to get started.</p>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === t.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeId === t.id && <Badge variant="success" className="gap-1"><Star className="size-3" /> active</Badge>}
                    <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
                  </div>
                </button>
              ))
            )}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="size-3.5" />}
              onClick={add}
              className="self-start"
            >
              New template
            </Button>
          </div>
        </SectionRow>
      </Section>

      {selected ? <TemplateEditor template={selected} onSave={save} onRemove={remove} onActivate={setActive} active={activeId === selected.id} /> : null}
    </div>
  );
}

function TemplateEditor({
  template,
  onSave,
  onRemove,
  onActivate,
  active
}: {
  template: PromptTemplate;
  onSave: (t: PromptTemplate) => void;
  onRemove: (id: string) => void;
  onActivate: (id: string) => void;
  active: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [body, setBody] = useState(template.body);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Edit template</CardTitle>
          <CardDescription>
            <span className="font-mono">{template.id}</span>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {active ? (
            <Badge variant="success" className="gap-1"><Check className="size-3" /> active</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onActivate(template.id)}>
              Make active
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete"
            onClick={() => onRemove(template.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <Label htmlFor="tpl-name">Name</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="tpl-body">Body</Label>
          <Textarea
            id="tpl-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 min-h-[260px] font-mono text-xs"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setName(template.name); setBody(template.body); }}>
            Discard
          </Button>
          <Button size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => onSave({ ...template, name, body })}>
            Save template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
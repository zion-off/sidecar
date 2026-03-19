import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAllModels } from '@/open-router/model';
import type { OpenRouterModel } from '@/types/open-router';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';

interface ModelBrowserProps {
  onSelect: (model: OpenRouterModel) => void;
  onClose: () => void;
  selectedModelId: string;
  recentModelIds: string[];
}

const SORT_KEYS = ['name', 'context_length', 'prompt_price', 'created'] as const;
type SortKey = (typeof SORT_KEYS)[number];

function isSortKey(v: string): v is SortKey {
  return (SORT_KEYS as readonly string[]).includes(v);
}

function getTokenizer(model: OpenRouterModel): string {
  return model.architecture.tokenizer.trim() || 'Other';
}

function getContextLength(model: OpenRouterModel): number | null {
  return model.top_provider.context_length ?? model.context_length;
}

function formatContext(ctx: number | null): string {
  if (ctx === null) return '—';
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`;
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}k`;
  return String(ctx);
}

function formatPrice(pricePerToken: string): string {
  const perMillion = Number(pricePerToken) * 1_000_000;
  if (!Number.isFinite(perMillion) || perMillion === 0) return 'Free';
  if (perMillion < 0.01) return '<$0.01/M';
  if (perMillion >= 1) return `$${perMillion.toFixed(perMillion % 1 === 0 ? 0 : 2)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
}

function sortModels(models: OpenRouterModel[], sort: SortKey): OpenRouterModel[] {
  const sorted = [...models];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'context_length': {
        const ac = getContextLength(a) ?? -1;
        const bc = getContextLength(b) ?? -1;
        return bc - ac || a.name.localeCompare(b.name);
      }
      case 'prompt_price': {
        const ap = Number(a.pricing.prompt);
        const bp = Number(b.pricing.prompt);
        const na = Number.isFinite(ap) ? ap : Number.POSITIVE_INFINITY;
        const nb = Number.isFinite(bp) ? bp : Number.POSITIVE_INFINITY;
        return na - nb || a.name.localeCompare(b.name);
      }
      case 'created':
        return b.created - a.created || a.name.localeCompare(b.name);
      default:
        return a.name.localeCompare(b.name);
    }
  });
  return sorted;
}

export function ModelBrowser({ onSelect, onClose, selectedModelId, recentModelIds }: ModelBrowserProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [family, setFamily] = useState('all');
  const [filterTools, setFilterTools] = useState(false);
  const [filterReasoning, setFilterReasoning] = useState(false);
  const cacheRef = useRef<OpenRouterModel[] | null>(null);

  const loadModels = useCallback(async (force = false) => {
    if (!force && cacheRef.current) {
      setModels(cacheRef.current);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllModels();
      cacheRef.current = response.data;
      setModels(response.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load models';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const families = useMemo(() => {
    return [...new Set(models.map(getTokenizer))].sort();
  }, [models]);

  const modelIndex = useMemo(() => {
    return new Map(models.map((m) => [m.id, m]));
  }, [models]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = models.filter((m) => {
      if (q && !`${m.name} ${m.id}`.toLowerCase().includes(q)) return false;
      if (filterTools && !m.supported_parameters.includes('tools')) return false;
      if (filterReasoning && !m.supported_parameters.includes('reasoning')) return false;
      if (family !== 'all' && getTokenizer(m) !== family) return false;
      return true;
    });
    return sortModels(result, sort);
  }, [search, models, sort, family, filterTools, filterReasoning]);

  const recentModels = useMemo(() => {
    return recentModelIds.map((id) => modelIndex.get(id)).filter((m): m is OpenRouterModel => m !== undefined);
  }, [recentModelIds, modelIndex]);

  useEffect(() => {
    if (family !== 'all' && families.length > 0 && !families.includes(family)) {
      setFamily('all');
    }
  }, [family, families]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-lc-bg-base">
      <div className="flex h-9 shrink-0 items-center justify-between bg-lc-layer-one px-3">
        <span className="text-[14px] font-semibold text-lc-primary">Models</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => void loadModels(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-neutral-300"
            title="Refresh"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-neutral-300"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b border-white/5 px-3 py-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models..."
          className="h-8 border-white/10 bg-lc-textarea-bg text-xs placeholder:text-xs focus-visible:ring-0"
          autoFocus
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <Select
            value={sort}
            onValueChange={(v) => {
              if (isSortKey(v)) setSort(v);
            }}
          >
            <SelectTrigger className="h-7 w-auto gap-1 border-white/10 bg-transparent px-2 text-xxs text-lc-text-secondary shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-lc-bg-popover">
              <SelectItem value="name" className="text-xxs">Name</SelectItem>
              <SelectItem value="context_length" className="text-xxs">Context ↓</SelectItem>
              <SelectItem value="prompt_price" className="text-xxs">Price ↑</SelectItem>
              <SelectItem value="created" className="text-xxs">Newest</SelectItem>
            </SelectContent>
          </Select>
          <Select value={family} onValueChange={setFamily}>
            <SelectTrigger className="h-7 w-auto max-w-[120px] gap-1 border-white/10 bg-transparent px-2 text-xxs text-lc-text-secondary shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-lc-bg-popover">
              <SelectItem value="all" className="text-xxs">All families</SelectItem>
              {families.map((f) => (
                <SelectItem key={f} value={f} className="text-xxs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Toggle
              pressed={filterTools}
              onPressedChange={setFilterTools}
              size="sm"
              className="h-7 border border-white/10 px-2 text-xxs text-lc-text-secondary data-[state=on]:bg-white/10 data-[state=on]:text-lc-text-body"
            >
              tools
            </Toggle>
            <Toggle
              pressed={filterReasoning}
              onPressedChange={setFilterReasoning}
              size="sm"
              className="h-7 border border-white/10 px-2 text-xxs text-lc-text-secondary data-[state=on]:bg-white/10 data-[state=on]:text-lc-text-body"
            >
              reasoning
            </Toggle>
          </div>
        </div>
      </div>

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
        {isLoading && models.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="animate-pulse text-xs text-lc-text-secondary">Loading models...</p>
          </div>
        ) : error && models.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="mb-2 text-xs text-lc-text-secondary">{error}</p>
            <button
              type="button"
              onClick={() => void loadModels(true)}
              className="text-xxs text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {recentModels.length > 0 && !search.trim() && (
              <section className="border-b border-white/5">
                <div className="px-3 pb-1 pt-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-lc-text-secondary">
                    Recent
                  </span>
                </div>
                {recentModels.map((model) => (
                  <ModelRow
                    key={`recent-${model.id}`}
                    model={model}
                    isSelected={model.id === selectedModelId}
                    onSelect={onSelect}
                  />
                ))}
              </section>
            )}

            <section>
              <div className="flex items-center justify-between px-3 pb-1 pt-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-lc-text-secondary">
                  All models
                </span>
                <span className="text-[10px] tabular-nums text-lc-text-secondary">{filtered.length}</span>
              </div>
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xxs text-lc-text-secondary">
                  No models match your filters
                </div>
              ) : (
                filtered.map((model) => (
                  <ModelRow
                    key={model.id}
                    model={model}
                    isSelected={model.id === selectedModelId}
                    onSelect={onSelect}
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ModelRow({
  model,
  isSelected,
  onSelect
}: {
  model: OpenRouterModel;
  isSelected: boolean;
  onSelect: (model: OpenRouterModel) => void;
}) {
  const ctx = getContextLength(model);
  const supportsTools = model.supported_parameters.includes('tools');
  const supportsReasoning = model.supported_parameters.includes('reasoning');

  return (
    <button
      type="button"
      onClick={() => onSelect(model)}
      className={`w-full border-b border-white/[0.03] px-3 py-2 text-left transition-colors ${
        isSelected ? 'bg-blue-500/[0.08]' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="truncate text-xs font-medium text-lc-text-body">{model.name || model.id}</span>
          <div className="mt-0.5 truncate font-mono text-[10px] text-lc-text-secondary">{model.id}</div>
        </div>
        <div className="shrink-0 pt-0.5 text-right">
          <div className="text-[10px] tabular-nums text-lc-text-secondary">{formatContext(ctx)}</div>
          <div className="text-[10px] tabular-nums text-lc-text-secondary">{formatPrice(model.pricing.prompt)}</div>
        </div>
      </div>
      {(supportsTools || supportsReasoning) && (
        <div className="mt-1 flex gap-1">
          {supportsTools && (
            <span className="rounded bg-white/[0.05] px-1 py-px text-[9px] text-lc-text-secondary">tools</span>
          )}
          {supportsReasoning && (
            <span className="rounded bg-white/[0.05] px-1 py-px text-[9px] text-lc-text-secondary">reasoning</span>
          )}
        </div>
      )}
    </button>
  );
}

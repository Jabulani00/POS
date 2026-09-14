import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { ComboOption, MenuItem, SelectedOption } from '../../types';
import { Button } from '../../components/Button';
import { FoodImage } from '../../components/FoodImage';
import { formatMoney } from '../../lib/format';

interface Props {
  item: MenuItem;
  onCancel: () => void;
  onConfirm: (options: SelectedOption[]) => void;
}

/** Group combo options by their option_name (e.g. "Choose your side"). */
function groupOptions(options: ComboOption[]): Record<string, ComboOption[]> {
  return options.reduce<Record<string, ComboOption[]>>((acc, o) => {
    (acc[o.option_name] ??= []).push(o);
    return acc;
  }, {});
}

export function ComboModal({ item, onCancel, onConfirm }: Props) {
  const groups = useMemo(() => groupOptions(item.combo_options), [item.combo_options]);
  const groupNames = Object.keys(groups);

  // Default each group to its first choice.
  const [selection, setSelection] = useState<Record<string, ComboOption>>(() => {
    const init: Record<string, ComboOption> = {};
    for (const name of groupNames) {
      const first = groups[name]?.[0];
      if (first) init[name] = first;
    }
    return init;
  });

  const extra = Object.values(selection).reduce((s, o) => s + o.price_delta, 0);

  const confirm = () => {
    const opts: SelectedOption[] = Object.values(selection).map((o) => ({
      option_name: o.option_name,
      choice_label: o.choice_label,
      price_delta: o.price_delta,
    }));
    onConfirm(opts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        className="w-full max-w-lg animate-slide-in rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <FoodImage
              src={item.image_url}
              emoji={item.emoji}
              alt={item.name}
              category={item.category}
              className="h-14 w-14 shrink-0 rounded-xl"
              emojiSize="text-2xl"
            />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-navy">{item.name}</h2>
              <p className="text-sm text-slate-500">{formatMoney(item.price)} base</p>
            </div>
          </div>
          <button onClick={onCancel} className="tap rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-5 overflow-y-auto">
          {groupNames.map((name) => (
            <fieldset key={name}>
              <legend className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{name}</legend>
              <div className="grid grid-cols-1 gap-2">
                {groups[name]?.map((opt) => {
                  const active = selection[name]?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelection((s) => ({ ...s, [name]: opt }))}
                      className={`tap flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${
                        active
                          ? 'border-brand-orange bg-orange-50'
                          : 'border-navy-100 bg-white hover:border-navy-100/80'
                      }`}
                    >
                      <span className="font-semibold text-navy">{opt.choice_label}</span>
                      <span className="text-sm text-slate-500">
                        {opt.price_delta > 0 ? `+${formatMoney(opt.price_delta)}` : 'Included'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="lg" className="flex-[2]" onClick={confirm}>
            Add · {formatMoney(item.price + extra)}
          </Button>
        </div>
      </div>
    </div>
  );
}

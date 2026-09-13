import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { FormField } from "@/components/dashboard/FormField";
import {
  formControlClass,
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import {
  productById,
  validateProductFields,
  type PlantProductId,
} from "@/lib/plantProducts";

type ProductIntakeFormProps = {
  productId: PlantProductId;
  values: Record<string, string>;
  alreadyRunning: boolean;
  onChange: (key: string, value: string) => void;
  onComplete: () => void;
  onBack?: () => void;
};

export function ProductIntakeForm({
  productId,
  values,
  alreadyRunning,
  onChange,
  onComplete,
  onBack,
}: ProductIntakeFormProps) {
  const product = productById(productId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateProductFields(product, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    // Local-only for now — products will persist via API later.
    window.setTimeout(() => {
      onComplete();
      setSaving(false);
    }, 200);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className={`${panelClass} flex min-h-0 flex-1 flex-col`}>
        <div className="border-b border-edge px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                Product {product.code}
              </p>
              <h2 className={`mt-0.5 ${sectionTitleClass}`}>{product.name}</h2>
              <p className={sectionHintClass}>{product.description}</p>
            </div>
            {alreadyRunning ? (
              <span className="inline-flex h-6 items-center rounded-md bg-accent/15 px-2 text-xs font-medium text-accent">
                Running
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted">
            Enables: {product.enables}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
          {product.fields.map((field) => (
            <FormField
              key={field.key}
              id={`pe-${product.id}-${field.key}`}
              label={field.label}
              required={field.required}
              error={errors[field.key]}
              hint={field.hint}
            >
              {field.type === "textarea" ? (
                <textarea
                  id={`pe-${product.id}-${field.key}`}
                  rows={3}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className={formControlClass(
                    errors[field.key],
                    "h-auto min-h-[80px] py-2",
                  )}
                />
              ) : field.type === "select" || field.type === "yesno" ? (
                <select
                  id={`pe-${product.id}-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className={formControlClass(errors[field.key])}
                >
                  <option value="">Select…</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`pe-${product.id}-${field.key}`}
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : field.type === "url"
                          ? "url"
                          : "text"
                  }
                  min={field.min}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className={formControlClass(errors[field.key])}
                />
              )}
            </FormField>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : alreadyRunning ? (
              <>
                Update & continue
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Complete & start product
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { HelpCircle, Info, X } from "lucide-react";
import { explainEntries, explainEntry, groupedExplainEntries, type ExplainEntry, type ExplainEntryId } from "../explainabilityContent";

export function InfoTip({ entryId, explainMode = false }: { entryId: ExplainEntryId; explainMode?: boolean }) {
  const entry = explainEntry(entryId);
  const reactId = useId();
  const tooltipId = `tooltip-${reactId.replaceAll(":", "")}`;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;

  function closeOnEscape(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      setHovered(false);
      setFocused(false);
    }
  }

  return (
    <span className={`info-tip${explainMode ? " explain-mode" : ""}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        className="info-tip-trigger"
        aria-label={`What is ${entry.title}?`}
        aria-describedby={tooltipId}
        aria-expanded={open}
        onClick={() => setFocused(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={closeOnEscape}
      >
        <Info size={13} aria-hidden="true" />
      </button>
      {open && (
        <span id={tooltipId} className="info-tip-bubble" role="tooltip">
          <strong>{entry.title}</strong>
          <span>{entry.short}</span>
        </span>
      )}
    </span>
  );
}

export function ExplainLabel({ children, entryId, explainMode = false }: { children: ReactNode; entryId: ExplainEntryId; explainMode?: boolean }) {
  return (
    <span className={`explain-label${explainMode ? " explain-mode" : ""}`}>
      <span>{children}</span>
      <InfoTip entryId={entryId} explainMode={explainMode} />
      {explainMode && <em>explained</em>}
    </span>
  );
}

export function ExplainButton({ entryId, label, explainMode = false }: { entryId: ExplainEntryId; label?: string; explainMode?: boolean }) {
  const entry = explainEntry(entryId);
  const [open, setOpen] = useState(false);
  const buttonLabel = label ?? `Under the hood: ${entry.title}`;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }

  return (
    <span className={`explain-popover-anchor${explainMode ? " explain-mode" : ""}`}>
      <button type="button" className="explain-button" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={onKeyDown}>
        <HelpCircle size={14} aria-hidden="true" />
        <span>{buttonLabel}</span>
      </button>
      {open && <UnderTheHoodPanel entry={entry} onClose={() => setOpen(false)} />}
    </span>
  );
}

export function UnderTheHoodPanel({ entry, onClose }: { entry: ExplainEntry; onClose: () => void }) {
  const snippet = entry.snippet ?? entry.formula ?? entry.underTheHood ?? entry.short;

  return (
    <section className="under-hood-panel" aria-label={`${entry.title} under the hood`}>
      <div className="under-hood-heading">
        <strong>{entry.title}</strong>
        <button type="button" className="icon-button" aria-label={`Close ${entry.title} explanation`} onClick={onClose}>
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <p>{entry.short}</p>
      {entry.physicalMeaning && <p>{entry.physicalMeaning}</p>}
      {entry.units && <UnitBadge>{entry.units}</UnitBadge>}
      {entry.formula && <FormulaBlock>{entry.formula}</FormulaBlock>}
      {entry.underTheHood && <p>{entry.underTheHood}</p>}
      {entry.snippet && <FormulaBlock label="Snippet">{entry.snippet}</FormulaBlock>}
      {entry.assumptions && entry.assumptions.length > 0 && <BulletList label="Assumptions" items={entry.assumptions} />}
      {entry.limitations && entry.limitations.length > 0 && <LimitationNote items={entry.limitations} />}
      <div className="maxwell-layer-actions">
        <button type="button" onClick={() => void navigator.clipboard?.writeText(snippet)}>
          <span>Copy snippet</span>
        </button>
      </div>
    </section>
  );
}

export function FormulaBlock({ children, label = "Formula" }: { children: ReactNode; label?: string }) {
  return (
    <div className="formula-block">
      <span>{label}</span>
      <code>{children}</code>
    </div>
  );
}

export function UnitBadge({ children }: { children: ReactNode }) {
  return <span className="unit-badge">{children}</span>;
}

export function LimitationNote({ items }: { items: string[] }) {
  return (
    <div className="limitation-note">
      <strong>Limitations</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ShowAllExplanationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return explainEntries;
    return explainEntries.filter((entry) => {
      const haystack = [
        entry.id,
        entry.title,
        entry.short,
        entry.physicalMeaning,
        entry.units,
        entry.formula,
        entry.underTheHood,
        entry.snippet,
        ...(entry.assumptions ?? []),
        ...(entry.limitations ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  if (!open) return null;

  return (
    <aside className="explanation-drawer" aria-label="Show all explanations">
      <div className="explanation-drawer-heading">
        <div>
          <h2>Show all explanations</h2>
          <p>Searchable glossary for formulas, units, assumptions, receipts, and limitations.</p>
        </div>
        <button type="button" className="icon-button" aria-label="Close explanations drawer" onClick={onClose}>
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <label className="field-row">
        <span>Search explanations</span>
        <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Airy, residual, backend, provenance, p90" />
      </label>
      <div className="explanation-drawer-groups">
        {groupedExplainEntries(filtered).map((group) => (
          <section key={group.section} className="explanation-group">
            <h3>{group.section}</h3>
            {group.entries.map((entry) => (
              <article key={entry.id} className="explanation-entry-card">
                <div className="maxwell-section-heading">
                  <h2>{entry.title}</h2>
                  <strong>{entry.id}</strong>
                </div>
                <p>{entry.short}</p>
                {entry.formula && <FormulaBlock>{entry.formula}</FormulaBlock>}
                {entry.snippet && <FormulaBlock label="Snippet">{entry.snippet}</FormulaBlock>}
                {entry.limitations && <LimitationNote items={entry.limitations} />}
              </article>
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="under-hood-list">
      <strong>{label}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

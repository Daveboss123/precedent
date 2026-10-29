'use client';

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { Domain } from '../core/types.ts';
import { itemImageFromFile } from '../lib/image-file.ts';
import type { Cadence, ListItem, NewItemInput } from '../lib/recurring.ts';
import { CADENCES, inferCategory, parseItemLines } from '../lib/recurring.ts';
import { BasketArt } from './illustrations.tsx';
import { ItemPhoto } from './item-photo.tsx';

interface Props {
  items: ListItem[];
  busy: boolean;
  onAdd: (items: NewItemInput[]) => Promise<boolean>;
  onPhoto: (id: string, image: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}

const KINDS: { value: Domain; label: string }[] = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'household', label: 'Household' },
  { value: 'gear', label: 'Gear' },
];

const STARTERS: NewItemInput[] = [
  { name: 'Olive oil', vendor: 'Green Grocer', price: 14, domain: 'pantry', cadence: 'monthly', image: '/products/olive-oil.jpg' },
  { name: 'Dish soap', vendor: 'Corner shop', price: 4.5, domain: 'household', cadence: 'every other month', image: '/products/dish-soap.jpg' },
  { name: 'Paper towels', vendor: 'Corner shop', price: 6, domain: 'household', cadence: 'monthly', image: '/products/paper-towels.jpg' },
  { name: 'Pasta', vendor: 'Green Grocer', price: 3.5, domain: 'pantry', cadence: 'monthly', image: '/products/pasta.jpg' },
  { name: 'Sparkling water', vendor: 'Green Grocer', price: 5, domain: 'pantry', cadence: 'weekly' },
];

export function YourList({ items, busy, onAdd, onPhoto, onRemove }: Props) {
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('');
  const [price, setPrice] = useState('10');
  const [kind, setKind] = useState<Domain>('pantry');
  const [cadence, setCadence] = useState<Cadence>('monthly');
  const [paste, setPaste] = useState('');
  const [fileName, setFileName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => parseItemLines(paste), [paste]);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const covered = items.filter((item) => item.decision.action === 'act').length;
  const needs = items.filter((item) => item.decision.action === 'ask').length;
  const blocked = items.filter((item) => item.decision.action === 'block').length;

  async function submitOne(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) return;

    const ok = await onAdd([
      {
        name: trimmed,
        vendor: vendor.trim(),
        price: Number(price) || 0,
        category: inferCategory(trimmed),
        domain: kind,
        cadence,
        image: photo,
      },
    ]);

    if (ok) {
      setName('');
      setVendor('');
      setPrice('10');
      setPhoto(null);
      setPhotoName('');
      if (photoInput.current) photoInput.current.value = '';
      setMessage(`Added ${trimmed}. It’s in this week’s basket.`);
    } else {
      setError('That item is already on your list, or it could not be saved.');
    }
  }

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setMessage(null);
    setError(null);
    setPhotoBusy(true);
    try {
      const data = await itemImageFromFile(file);
      setPhoto(data);
      setPhotoName(file.name);
    } catch (err) {
      setPhoto(null);
      setPhotoName('');
      setError(err instanceof Error ? err.message : 'That photo could not be used.');
    } finally {
      setPhotoBusy(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoName('');
    if (photoInput.current) photoInput.current.value = '';
  }

  async function addPaste() {
    if (preview.length === 0) return;
    setMessage(null);
    setError(null);

    const ok = await onAdd(preview);
    if (ok) {
      setMessage(`Added ${preview.length} item${preview.length === 1 ? '' : 's'}. They’re in this week’s basket.`);
      setPaste('');
      setFileName('');
    } else {
      setError('Those items are already on your list, or they could not be saved.');
    }
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setPaste(text);
      setFileName(file.name);
      setMessage(null);
      setError(null);
    } catch {
      setError('That file could not be read. A plain text or CSV file works best.');
    }
  }

  async function remove(id: string) {
    setMessage(null);
    setError(null);
    const ok = await onRemove(id);
    if (!ok) setError('That item could not be removed.');
  }

  return (
    <>
      <header className="page-head">
        <p className="page-kicker">List</p>
        <h1 className="page-title">Your list</h1>
        <p className="page-sub">The things you buy again and again.</p>
      </header>

      <section className="today-stats" aria-label="Your list at a glance">
        <div className="today-stat">
          <b>{items.length}</b>
          <span>Things tracked</span>
        </div>
        <div className="today-stat">
          <b>{covered}</b>
          <span>Covered</span>
        </div>
        <div className="today-stat">
          <b>{needs}</b>
          <span>Need you</span>
        </div>
        <div className="today-stat">
          <b>{money(total)}</b>
          <span>Usual basket</span>
        </div>
      </section>

      <section className="panel list-add-panel">
        <div className="panel-head">
          <h2 className="panel-title">Add something you buy</h2>
        </div>

        <form className="list-add-form" onSubmit={submitOne}>
          <div className="list-photo-field">
            <label className={`list-photo-pick ${photo ? 'has-photo' : ''}`}>
              {photo ? (
                <img src={photo} alt="" />
              ) : (
                <span aria-hidden="true">{photoBusy ? '…' : '+'}</span>
              )}
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void choosePhoto(event)}
                disabled={photoBusy || busy}
                aria-label="Upload a photo of the item"
              />
            </label>
            <div className="list-photo-copy">
              <b>
                {photoBusy
                  ? 'Preparing photo…'
                  : photo
                    ? photoName
                    : 'Add a photo of the item'}
              </b>
              <small>
                {photo
                  ? 'Shown on the item card. JPG, PNG or WebP.'
                  : 'Optional. JPG, PNG or WebP, cropped square.'}
              </small>
              {photo && (
                <button type="button" className="list-photo-remove" onClick={clearPhoto}>
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="field list-field-name">
            <label htmlFor="item-name">What do you buy?</label>
            <input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Olive oil, oat milk, paper towels…"
              autoComplete="off"
            />
          </div>

          <div className="field list-field-vendor">
            <label htmlFor="item-vendor">Where?</label>
            <input
              id="item-vendor"
              value={vendor}
              onChange={(event) => setVendor(event.target.value)}
              placeholder="Green Grocer"
              autoComplete="off"
            />
          </div>

          <div className="field list-field-price">
            <label htmlFor="item-price">Price</label>
            <input
              id="item-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>

          <div className="field list-field-cadence">
            <label htmlFor="item-cadence">How often?</label>
            <select
              id="item-cadence"
              value={cadence}
              onChange={(event) => setCadence(event.target.value as Cadence)}
            >
              {CADENCES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field list-field-kind">
            <label htmlFor="item-kind">Kind</label>
            <select
              id="item-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as Domain)}
            >
              {KINDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn--dark list-add-button"
            disabled={busy || photoBusy || !name.trim()}
          >
            {busy ? 'Adding…' : 'Add to my list'}
          </button>
        </form>

        <div className="list-tools">
          <details className="list-paste">
            <summary>
              Paste a list instead <span aria-hidden="true">+</span>
            </summary>
            <div className="list-paste-body">
              <p>One item per line, with name, store and price in any order.</p>
              <textarea
                rows={5}
                value={paste}
                onChange={(event) => {
                  setPaste(event.target.value);
                  setFileName('');
                }}
                placeholder={'Olive oil, Green Grocer, 14\nDish soap, Corner shop, 4.50, household, every other month'}
              />
              {preview.length > 0 && (
                <p className="list-preview-count">
                  {preview.length} item{preview.length === 1 ? '' : 's'} ready:{' '}
                  {preview.map((item) => item.name).slice(0, 4).join(', ')}
                  {preview.length > 4 ? '…' : ''}
                </p>
              )}
              <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className="btn btn--dark"
                  onClick={() => void addPaste()}
                  disabled={busy || preview.length === 0}
                >
                  Add {preview.length > 0 ? preview.length : ''} item
                  {preview.length === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          </details>

          <label className="btn btn--ghost list-upload">
            {fileName ? `Using ${fileName}` : 'Upload a CSV or text file'}
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={(event) => void readFile(event)}
            />
          </label>
        </div>

        <div className="list-starters">
          <span>Quick add:</span>
          {STARTERS.map((starter) => (
            <button
              key={starter.name}
              className="list-chip"
              disabled={busy}
              onClick={() => {
                setMessage(null);
                setError(null);
                void onAdd([starter]).then((ok) => {
                  if (ok) setMessage(`Added ${starter.name}. It’s in this week’s basket.`);
                  else setError('That item is already on your list.');
                });
              }}
            >
              + {starter.name}
            </button>
          ))}
        </div>

        {message && <p className="list-message">{message}</p>}
        {error && <p className="list-error">{error}</p>}
      </section>

      <section className="panel list-panel">
        <div className="panel-head">
          <h2 className="panel-title">
            {items.length} thing{items.length === 1 ? '' : 's'} you buy again
          </h2>
          <span className="panel-note">{covered} handled · {needs} {needs === 1 ? 'needs' : 'need'} you · {blocked} blocked</span>
        </div>

        {items.length === 0 ? (
          <div className="empty" style={{ marginTop: 16 }}>
            Your list is empty. Add the first thing you buy every week.
          </div>
        ) : (
          <div className="list-rows">
            {items.map((item) => (
              <ListRow
                key={item.id}
                item={item}
                busy={busy}
                onPhoto={onPhoto}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ListRow({
  item,
  busy,
  onPhoto,
  onRemove,
}: {
  item: ListItem;
  busy: boolean;
  onPhoto: (id: string, image: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const data = await itemImageFromFile(file);
      const ok = await onPhoto(item.id, data);
      if (!ok) setPhotoError('That photo could not be saved.');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'That photo could not be used.');
    } finally {
      setPhotoBusy(false);
    }
  }

  const status =
    item.decision.action === 'act'
      ? 'handled'
      : item.decision.action === 'block'
        ? 'blocked'
        : 'needed';
  const label =
    status === 'handled'
      ? 'Handled'
      : status === 'blocked'
        ? 'Blocked'
        : 'Needs you';

  return (
    <div className={`list-row list-row--${status}`}>
      <div className="list-thumb">
        {item.image ? (
          <ItemPhoto src={item.image} sizes="56px" />
        ) : (
          <BasketArt />
        )}
      </div>

      <div className="list-row-main">
        <div className="list-row-title">
          <b>{item.name}</b>
          <span className={`list-status list-status--${status}`}>{label}</span>
        </div>
        <p>
          {item.vendor} · {item.cadence}
        </p>
        {item.rule && <p className="list-row-rule">“{item.rule}”</p>}
      </div>

      <div className="list-row-side">
        <b>{item.price > 0 ? money(item.price) : 'Price needed'}</b>
        {status === 'needed' && (
          <a className="list-row-link" href="#today">
            Answer →
          </a>
        )}
        {status === 'blocked' && (
          <a className="list-row-link" href="#limits">
            See limits →
          </a>
        )}
        <label className="list-photo-change">
          {photoBusy ? 'Saving…' : item.image ? 'Change photo' : 'Add photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void choosePhoto(event)}
            disabled={busy || photoBusy}
          />
        </label>
        {photoError && (
          <span className="list-photo-error" role="alert">
            {photoError}
          </span>
        )}
        <button
          className="list-remove"
          disabled={busy}
          onClick={() => void onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          title={`Remove ${item.name}`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * The public face of Precedent.
 *
 * Product first, proof last. A visitor should understand the promise, see a
 * real basket, and know what they would do next before they ever hear the
 * words Walrus or Tatum.
 */

import Image from 'next/image';
import type { ReactNode } from 'react';

import {
  CoffeeArt,
  OatMilkArt,
  QuestionArt,
  QuietArt,
  ReceiptArt,
  RuleArt,
  StreamingArt,
} from './illustrations.tsx';
import { ScrollReveal } from './scroll-reveal.tsx';

const ACCOUNT = '0x9ed016de2fbfa51d73363495e7158e40f8761a0c253c9198c430423d624f6d55';
const EXPLORER = `https://suivision.xyz/object/${ACCOUNT}`;
const REPO = 'https://github.com/Daveboss123/precedent';

type State = 'Handled' | 'Needs you' | 'Blocked' | 'Rule needed';
type Tone = 'handled' | 'ask' | 'block' | 'needed';

export function Landing() {
  return (
    <div className="pd" id="top">
      <a className="pd-skip" href="#main">
        Skip to content
      </a>

      <header className="pd-nav">
        <a className="pd-brand" href="/" aria-label="Precedent home">
          Precedent<span>§</span>
        </a>

        <nav className="pd-nav-links" aria-label="Primary">
          <a href="#how">
            <span>01</span>How it works
          </a>
          <a href="#list">
            <span>02</span>Your list
          </a>
          <a href="#remembers">
            <span>03</span>Why it remembers
          </a>
        </nav>

        <div className="pd-nav-actions">
          <a className="pd-nav-proof" href="/proof">
            The record
          </a>
          <a className="pd-nav-cta" href="/ledger">
            Open the app <Arrow />
          </a>
        </div>
      </header>

      <main id="main">
        <section className="pd-hero" aria-labelledby="pd-hero-title">
          <span className="pd-folio" aria-hidden="true">
            Case no. 001 · The weekly shop
          </span>

          <div className="pd-hero-grid">
            <div className="pd-hero-copy">
              <p className="pd-eyebrow">
                <span className="pd-live-dot" aria-hidden="true" />
                For the things you buy again and again
              </p>

              <h1 id="pd-hero-title">
                The weekly shop,
                <br />
                without the
                <br />
                weekly <em>debate</em>.
              </h1>

              <p className="pd-lede">
                Precedent learns the rules you already have — the coffee you
                like, the oat milk you’ll pay extra for, when it should ask —
                and handles the repeat buys.
              </p>

              <div className="pd-actions">
                <a className="pd-btn pd-btn--primary" href="/ledger">
                  Open this week’s basket <Arrow />
                </a>
                <a className="pd-btn pd-btn--ghost" href="#how">
                  See how it decides <span className="pd-down" aria-hidden="true">↓</span>
                </a>
              </div>

              <p className="pd-fine">
                No sign-up <span>·</span> Add what you buy <span>·</span> Answer once
              </p>
            </div>

            <div
              className="pd-hero-stage"
              aria-label="A preview of this week’s demo basket"
            >
              <div className="pd-stage-card">
                <div className="pd-stage-top">
                  <span className="pd-stage-label">This week</span>
                  <span className="pd-stage-count">8 decisions</span>
                  <span className="pd-stamp pd-stamp--demo">Demo</span>
                </div>

                <div className="pd-stage-meter" aria-hidden="true">
                  <span className="pd-stage-seg pd-stage-seg--handled" />
                  <span className="pd-stage-seg pd-stage-seg--ask" />
                  <span className="pd-stage-seg pd-stage-seg--block" />
                </div>

                <div className="pd-stage-keys" aria-hidden="true">
                  <span><i className="pd-dot pd-dot--forest" />5 handled</span>
                  <span><i className="pd-dot pd-dot--amber" />2 need you</span>
                  <span><i className="pd-dot pd-dot--accent" />1 blocked</span>
                </div>

                <div className="pd-stage-rows">
                  <LedgerRow
                    art={<CoffeeArt />}
                    name="House blend beans"
                    meta="Roaster A · $18.00"
                    rule="#1 + #8"
                    state="Needs you"
                    tone="ask"
                  />
                  <LedgerRow
                    art={<OatMilkArt />}
                    name="Oat milk"
                    meta="Green Grocer · $6.00"
                    rule="#3"
                    state="Handled"
                    tone="handled"
                  />
                  <LedgerRow
                    art={<QuestionArt />}
                    name="Paper filters"
                    meta="Green Grocer · $9.00"
                    rule="#6"
                    state="Handled"
                    tone="handled"
                  />
                  <LedgerRow
                    art={<StreamingArt />}
                    name="Streaming plan"
                    meta="Vendor Y · $12.00"
                    rule="Limit"
                    state="Blocked"
                    tone="block"
                  />
                </div>

                <div className="pd-stage-foot">
                  <span>Every line carries the rule it rested on.</span>
                  <a href="/ledger">
                    Open the basket <Arrow />
                  </a>
                </div>
              </div>

              <div className="pd-stage-under">
                <aside className="pd-ruling">
                  <span className="pd-ruling-kicker">One answer becomes a precedent</span>
                  <p>
                    “Buy the house blend. The hold-off was only for last month.”
                  </p>
                  <div className="pd-ruling-meta">
                    <b>#9</b>
                    <span>overrules #8 · #1 stays active</span>
                  </div>
                </aside>

                <p className="pd-stage-caption">
                  <span className="pd-live-dot" aria-hidden="true" />
                  A working demo, not a mock-up.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="pd-principle">
          <div className="pd-principle-inner">
            <span>Written in your words</span>
            <i aria-hidden="true">§</i>
            <span>Cited before it acts</span>
            <i aria-hidden="true">§</i>
            <span>Superseded, never erased</span>
          </div>
        </div>

        <section id="how" className="pd-section pd-how" data-reveal>
          <header className="pd-section-head">
            <span className="pd-section-index" aria-hidden="true">01</span>
            <div className="pd-section-title">
              <p className="pd-kicker">How it works</p>
              <h2>
                It asks once.
                <br />
                Then it <em>stops asking.</em>
              </h2>
            </div>
            <p className="pd-section-lede">
              You don’t fill in a preferences page. You answer the question in
              front of you, in your own words. Precedent keeps the answer and
              applies it the next time the same situation comes around.
            </p>
          </header>

          <div className="pd-steps">
            <Step
              number="01"
              label="You said"
              title="You answer a question."
              copy="Oat milk is $11.40 and you’ve never picked a brand. It asks instead of guessing."
              quote="“The good one, when guests are coming.”"
              art={<QuestionArt />}
            />
            <Step
              number="02"
              label="It wrote"
              title="It writes down the rule."
              copy="Not a settings toggle. Your words, the situation, and the narrow thing they apply to."
              quote="Guests → good oat milk."
              art={<RuleArt />}
            />
            <Step
              number="03"
              label="Next time"
              title="It stops asking."
              copy="Next time guests come, the good oat milk goes in the basket. You see the rule it followed."
              quote="Handled. No prompt."
              art={<QuietArt />}
            />
          </div>
        </section>

        <section id="list" className="pd-section pd-list" data-reveal>
          <div className="pd-split-copy">
            <p className="pd-kicker">
              <span>02</span> Your list
            </p>
            <h2>
              The whole setup is
              <br />
              the stuff you
              <br />
              <em>already buy.</em>
            </h2>
            <p>
              Type one item. Paste the list from your notes app. Upload a file
              from your last shop. Precedent turns the things you buy again and
              again into a weekly basket — and asks only where it doesn’t know
              your rule yet.
            </p>

            <ul className="pd-checks">
              <li>
                <Check />
                <span><b>Type it.</b> Coffee, oat milk, filters, dish soap.</span>
              </li>
              <li>
                <Check />
                <span><b>Paste it.</b> One item per line, straight from your notes.</span>
              </li>
              <li>
                <Check />
                <span><b>Upload it.</b> A CSV or text file from your last order.</span>
              </li>
            </ul>

            <a className="pd-btn pd-btn--primary" href="/ledger#list">
              Add what you buy <Arrow />
            </a>
          </div>

          <div className="pd-list-preview">
            <span className="pd-list-tab" aria-hidden="true">The weekly list</span>

            <div className="pd-list-head">
              <div>
                <span className="pd-list-kicker">Your list</span>
                <strong>6 things</strong>
              </div>
              <div className="pd-list-total">
                <b>$67.50</b>
                <span>this week</span>
              </div>
            </div>

            <div className="pd-list-rows">
              <PreviewRow
                image="/products/coffee-bag.jpg"
                name="House blend beans"
                meta="Roaster A · every week"
                price="$18.00"
                state="Handled"
                tone="handled"
              />
              <PreviewRow
                image="/products/oat-milk.jpg"
                name="Oat milk"
                meta="Green Grocer · every week"
                price="$6.00"
                state="Rule needed"
                tone="needed"
              />
              <PreviewRow
                image="/products/filters-real.jpg"
                name="Paper filters"
                meta="Green Grocer · monthly"
                price="$9.00"
                state="Handled"
                tone="handled"
              />
              <PreviewRow
                image="/products/espresso-pods.jpg"
                name="Espresso pods"
                meta="Roaster B · monthly"
                price="$16.00"
                state="Handled"
                tone="handled"
              />
              <PreviewRow
                image="/products/olive-oil.jpg"
                name="Olive oil"
                meta="Green Grocer · monthly"
                price="$14.00"
                state="Rule needed"
                tone="needed"
              />
              <PreviewRow
                image="/products/dish-soap.jpg"
                name="Dish soap"
                meta="Corner shop · every other month"
                price="$4.50"
                state="Rule needed"
                tone="needed"
              />
            </div>

            <div className="pd-list-add">
              <span aria-hidden="true">+</span>
              Add something you buy every week
            </div>

            <div className="pd-list-foot">
              <span>3 handled · 3 need a rule</span>
              <span>Prices from the demo list</span>
            </div>
          </div>
        </section>

        <section id="remembers" className="pd-section pd-remembers" data-reveal>
          <div className="pd-split-copy">
            <p className="pd-kicker">
              <span>03</span> Why it remembers
            </p>
            <h2>
              You correct it once.
              <br />
              It remembers <em>why.</em>
            </h2>
            <p>
              The cheaper beans arrived and were too acidic. You didn’t edit a
              setting — you told it what happened. The old rule stays on the
              record; the new one takes over.
            </p>
            <p>
              That’s the difference between an app that forgets and one that
              learns the way a person does: by being wrong, and being told.
            </p>

            <div className="pd-rule-note">
              <div className="pd-rule-note-top">
                <span>Your rule</span>
                <span>#7</span>
              </div>
              <blockquote>
                “Pay the premium and stay with Roaster A. The cheaper beans were
                too acidic.”
              </blockquote>
              <p>Written after the order. Cited the next time the price jumps.</p>
            </div>
          </div>

          <div className="pd-chain-wrap">
            <div className="pd-chain-photo">
              <Image
                src="/products/coffee-bag.jpg"
                alt="A bag of Roaster A coffee"
                fill
                sizes="(max-width: 960px) 92vw, 46vw"
              />
              <span className="pd-chain-photo-note">The return: too acidic.</span>
            </div>

            <div className="pd-chain-body">
              <div className="pd-chain-head">
                <span>The coffee correction</span>
                <span className="pd-mono">#2 → #7</span>
              </div>

              <article className="pd-chain-card pd-chain-card--old">
                <div className="pd-chain-card-top">
                  <span>Original rule</span>
                  <span className="pd-stamp pd-stamp--muted">Superseded</span>
                </div>
                <blockquote>
                  “Above a 15% jump, switch to the cheaper roaster.”
                </blockquote>
                <div className="pd-chain-card-foot">
                  <span>#2</span>
                  <span>Still on the record</span>
                </div>
              </article>

              <div className="pd-chain-link" aria-hidden="true">
                <span />
                <em>corrected by</em>
                <span />
              </div>

              <article className="pd-chain-card pd-chain-card--new">
                <div className="pd-chain-card-top">
                  <span>Active rule</span>
                  <span className="pd-stamp pd-stamp--auto">In force</span>
                </div>
                <blockquote>
                  “Pay the premium and stay with Roaster A. The cheaper beans
                  were too acidic.”
                </blockquote>
                <div className="pd-chain-card-foot">
                  <span>#7</span>
                  <span>Written after the return</span>
                </div>
              </article>

              <p className="pd-chain-foot">
                <span aria-hidden="true">§</span>
                Nothing deleted. The history is the reason it gets it right next
                time.
              </p>
            </div>
          </div>
        </section>

        <div className="pd-limits-band">
          <section className="pd-section pd-limits" data-reveal>
            <header className="pd-section-head pd-limits-head">
              <span className="pd-section-index" aria-hidden="true">04</span>
              <div className="pd-section-title">
                <p className="pd-kicker">Your limits</p>
                <h2>
                  It can only go
                  <br />
                  as far as you <em>say.</em>
                </h2>
              </div>
              <p className="pd-section-lede">
                Rules are preferences. Limits are not. They are checked before
                anything else, and no answer can learn around them.
              </p>
              <div className="pd-seal" aria-label="Checked before it acts">
                <span>Checked<br />before<br />it acts</span>
                <b aria-hidden="true">§</b>
              </div>
            </header>

            <div className="pd-charter">
              <div className="pd-clause">
                <span className="pd-clause-number">01</span>
                <p className="pd-clause-label">A monthly ceiling</p>
                <b className="pd-clause-value">$150</b>
                <p className="pd-clause-copy">
                  When the month’s budget is gone, it stops and tells you.
                </p>
              </div>
              <div className="pd-clause">
                <span className="pd-clause-number">02</span>
                <p className="pd-clause-label">Ask me above</p>
                <b className="pd-clause-value">$100</b>
                <p className="pd-clause-copy">
                  Anything bigger waits for your yes, even if a rule applies.
                </p>
              </div>
              <div className="pd-clause">
                <span className="pd-clause-number">03</span>
                <p className="pd-clause-label">Hard no’s</p>
                <b className="pd-clause-value pd-clause-value--text">No subscriptions</b>
                <p className="pd-clause-copy">
                  Blocked before it looks at what it remembers.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="pd-section pd-record" data-reveal>
          <div className="pd-split-copy">
            <p className="pd-kicker">
              <span>05</span> The record
            </p>
            <h2>
              See everything
              <br />
              it <em>did.</em>
            </h2>
            <p>
              Every order, every question, every block. Each line carries the
              rule it rested on, so you can check the reasoning instead of
              trusting a black box.
            </p>
            <div className="pd-record-actions">
              <a className="pd-btn pd-btn--primary" href="/ledger">
                Open this week’s basket <Arrow />
              </a>
              <a className="pd-text-link" href="/proof">
                See the mainnet record <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="pd-receipt">
            <div className="pd-receipt-head">
              <span className="pd-receipt-art" aria-hidden="true"><ReceiptArt /></span>
              <div>
                <span>This week</span>
                <b>6 decisions · 1 needs you</b>
              </div>
              <span className="pd-stamp pd-stamp--muted">Record</span>
            </div>

            <ReceiptRow name="House blend beans" price="$18.00" state="Handled" tone="handled" />
            <ReceiptRow name="Paper filters" price="$9.00" state="Handled" tone="handled" />
            <ReceiptRow name="Oat milk" price="$11.40" state="Needs you" tone="ask" />
            <ReceiptRow name="Streaming plan" price="$12.00" state="Blocked" tone="block" />
            <ReceiptRow name="27 inch display" price="$320.00" state="Needs you" tone="ask" />

            <div className="pd-receipt-foot">
              <span>Every line has a reason.</span>
              <a href="/proof">Open the record <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        <section className="pd-cta" data-reveal>
          <div className="pd-cta-inner">
            <div className="pd-cta-copy">
              <p className="pd-kicker pd-kicker--light">Ready when you are</p>
              <h2>
                Stop deciding
                <br />
                the same thing <em>twice.</em>
              </h2>
              <p>
                Add your list. Answer once. Let it handle the rest.
              </p>
              <div className="pd-cta-actions">
                <a className="pd-btn pd-btn--light" href="/ledger">
                  Open the demo <Arrow />
                </a>
                <a className="pd-cta-link" href="/proof">
                  See the record <span aria-hidden="true">→</span>
                </a>
              </div>
              <p className="pd-cta-note">
                No sign-up <span>·</span> Reset the demo whenever you like
              </p>
            </div>

            <div className="pd-cta-seal" aria-hidden="true">
              <Seal />
            </div>
          </div>
        </section>

        <section className="pd-faq" data-reveal>
          <div className="pd-faq-aside">
            <p className="pd-kicker">
              <span>06</span> Questions
            </p>
            <h2>
              A few things
              <br />
              worth <em>knowing.</em>
            </h2>

            <div className="pd-faq-art">
              <img
                src="/illus/groceries.svg"
                alt="A shopper carrying a bag of groceries"
                loading="lazy"
              />
              <span>The weekly shop, handled.</span>
            </div>

            <p className="pd-faq-note">
              Still curious? <a href="/ledger">Open the demo</a> and answer one
              question.
            </p>
          </div>

          <div className="pd-faq-list">
            <details className="pd-faq-item" name="precedent-faq" open>
              <summary>
                <span className="pd-faq-index" aria-hidden="true">01</span>
                <span className="pd-faq-question">Do I have to set up rules first?</span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                No. Add the things you buy. Precedent asks only where it doesn’t
                know your rule yet.
              </p>
            </details>

            <details className="pd-faq-item" name="precedent-faq">
              <summary>
                <span className="pd-faq-index" aria-hidden="true">02</span>
                <span className="pd-faq-question">What happens when it gets it wrong?</span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                Tell it what happened. The old rule stays on the record; the new
                one takes over.
              </p>
            </details>

            <details className="pd-faq-item" name="precedent-faq">
              <summary>
                <span className="pd-faq-index" aria-hidden="true">03</span>
                <span className="pd-faq-question">Can it spend without asking?</span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                Only inside your limits. A monthly ceiling, an ask-above amount,
                and hard no’s are checked first.
              </p>
            </details>

            <details className="pd-faq-item" name="precedent-faq">
              <summary>
                <span className="pd-faq-index" aria-hidden="true">04</span>
                <span className="pd-faq-question">Is this a real checkout?</span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                No. This is a working demo with a seeded basket. No orders are
                placed. The mainnet record is the separate, append-only
                evidence behind it.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="pd-footer">
        <div className="pd-footer-inner">
          <div className="pd-footer-main">
            <div className="pd-footer-brand-col">
              <a className="pd-footer-wordmark" href="/">
                Precedent<span>§</span>
              </a>
              <p>The weekly shop, handled.</p>
              <span className="pd-footer-note">A demo, not a checkout.</span>
            </div>

            <div className="pd-footer-cols">
              <div>
                <p className="pd-footer-col-title">Product</p>
                <a href="#how">How it works</a>
                <a href="#list">Your list</a>
                <a href="/ledger">Open the app</a>
              </div>
              <div>
                <p className="pd-footer-col-title">Proof</p>
                <a href="/proof">The record</a>
                <a href={EXPLORER} target="_blank" rel="noreferrer">
                  SuiVision
                </a>
                <a href={REPO} target="_blank" rel="noreferrer">
                  Source
                </a>
              </div>
            </div>
          </div>

          <div className="pd-footer-bottom">
            <span>Built for Tatum × Walrus · Track 2</span>
            <span>© 2026 Precedent</span>
            <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </footer>

      <ScrollReveal />
    </div>
  );
}

function LedgerRow({
  art,
  name,
  meta,
  rule,
  state,
  tone,
}: {
  art: ReactNode;
  name: string;
  meta: string;
  rule: string;
  state: State;
  tone: Tone;
}) {
  return (
    <div className={`pd-row pd-row--${tone}`}>
      <span className="pd-row-art" aria-hidden="true">{art}</span>
      <div className="pd-row-main">
        <b>{name}</b>
        <span>{meta}</span>
      </div>
      <span className="pd-row-rule">{rule}</span>
      <span className={`pd-state pd-state--${tone}`}>
        <i aria-hidden="true" />
        {state}
      </span>
    </div>
  );
}

function Step({
  number,
  label,
  title,
  copy,
  quote,
  art,
}: {
  number: string;
  label: string;
  title: string;
  copy: string;
  quote: string;
  art: ReactNode;
}) {
  return (
    <article className="pd-step">
      <div className="pd-step-top">
        <span className="pd-step-number">{number}</span>
        <span className="pd-step-art" aria-hidden="true">{art}</span>
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <div className="pd-step-quote">
        <span>{label}</span>
        <blockquote>{quote}</blockquote>
      </div>
    </article>
  );
}

function PreviewRow({
  image,
  name,
  meta,
  price,
  state,
  tone,
}: {
  image: string;
  name: string;
  meta: string;
  price: string;
  state: State;
  tone: Tone;
}) {
  return (
    <div className="pd-lrow">
      <span className="pd-lrow-photo">
        <Image src={image} alt="" fill sizes="44px" />
      </span>
      <span className="pd-lrow-main">
        <b>{name}</b>
        <span>{meta}</span>
      </span>
      <span className="pd-lrow-price">{price}</span>
      <span className={`pd-state pd-state--${tone}`}>
        <i aria-hidden="true" />
        {state}
      </span>
    </div>
  );
}

function ReceiptRow({
  name,
  price,
  state,
  tone,
}: {
  name: string;
  price: string;
  state: State;
  tone: Tone;
}) {
  return (
    <div className="pd-rrow">
      <span>{name}</span>
      <b>{price}</b>
      <span className={`pd-state pd-state--${tone}`}>
        <i aria-hidden="true" />
        {state}
      </span>
    </div>
  );
}

function Check() {
  return (
    <svg className="pd-check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      className="pd-arrow"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      aria-hidden="true"
    >
      <path
        d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Seal() {
  return (
    <svg className="pd-seal-svg" viewBox="0 0 260 260" role="presentation">
      <defs>
        <path
          id="pd-seal-ring"
          d="M130,130 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0"
        />
      </defs>
      <circle cx="130" cy="130" r="124" fill="none" stroke="currentColor" strokeOpacity="0.24" />
      <circle cx="130" cy="130" r="106" fill="none" stroke="currentColor" strokeOpacity="0.38" />
      <text className="pd-seal-ring">
        <textPath href="#pd-seal-ring">
          THE WEEKLY SHOP, HANDLED · ON THE RECORD · THE WEEKLY SHOP, HANDLED ·
        </textPath>
      </text>
      <text className="pd-seal-mark" x="130" y="145" textAnchor="middle">§</text>
      <text className="pd-seal-caption" x="130" y="181" textAnchor="middle">PRECEDENT</text>
    </svg>
  );
}

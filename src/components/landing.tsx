/**
 * The public face of Precedent.
 *
 * Product first, proof last. A visitor should understand the promise, see a
 * real basket, and know what they would do next before they ever hear the
 * words Walrus or Tatum.
 */

import Image from 'next/image';
import type { ReactNode } from 'react';

import { ScrollReveal } from './scroll-reveal.tsx';
import { Wordmark } from './wordmark.tsx';

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

      <header className="pd-nav" data-nav>
        <span className="pd-progress" data-progress aria-hidden="true" />

        <a className="pd-brand" href="/" aria-label="Precedent home">
          <Wordmark />
        </a>

        <nav className="pd-nav-links" aria-label="Primary">
          <a href="#how" data-navlink>
            How it works
          </a>
          <a href="#list" data-navlink>
            Your list
          </a>
          <a href="#remembers" data-navlink>
            Why it remembers
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
          <div className="pd-hero-grid">
            <div className="pd-hero-copy">
              <p className="pd-eyebrow">
                For the things you buy again and again
              </p>

              <h1 id="pd-hero-title">
                <span className="pd-h1-line">
                  <span>The weekly shop,</span>
                </span>
                <span className="pd-h1-line">
                  <span>without the</span>
                </span>
                <span className="pd-h1-line">
                  <span>
                    <em>weekly debate.</em>
                  </span>
                </span>
              </h1>

              <p className="pd-lede">
                Precedent learns the rules you already have: the coffee you
                like, the oat milk you will pay extra for, when it should ask.
                Then it handles the repeat buys.
              </p>

              <div className="pd-actions">
                <a className="pd-btn pd-btn--primary" href="/ledger">
                  Open this week’s basket <Arrow />
                </a>
                <a className="pd-btn pd-btn--ghost" href="#how">
                  See how it decides
                </a>
              </div>

              <p className="pd-hero-note">
                <span aria-hidden="true">§</span>
                Every line carries the rule it rested on.
              </p>
            </div>

            <div
              className="pd-hero-stage"
              role="group"
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
                  <span>
                    <i className="pd-dot pd-dot--forest" />
                    5 handled
                  </span>
                  <span>
                    <i className="pd-dot pd-dot--amber" />
                    2 need you
                  </span>
                  <span>
                    <i className="pd-dot pd-dot--accent" />
                    1 blocked
                  </span>
                </div>

                <div className="pd-stage-rows">
                  <LedgerRow
                    image="/products/coffee-bag.jpg"
                    name="House blend beans"
                    meta="Roaster A, $18.00"
                    rule="#1 + #8"
                    state="Needs you"
                    tone="ask"
                  />
                  <LedgerRow
                    image="/products/oat-milk.jpg"
                    name="Oat milk"
                    meta="Green Grocer, $6.00"
                    rule="#3"
                    state="Handled"
                    tone="handled"
                  />
                  <LedgerRow
                    image="/products/filters-real.jpg"
                    name="Paper filters"
                    meta="Green Grocer, $9.00"
                    rule="#6"
                    state="Handled"
                    tone="handled"
                  />
                  <LedgerRow
                    glyph={<PlanGlyph />}
                    name="Streaming plan"
                    meta="Vendor Y, $12.00"
                    rule="Limit"
                    state="Blocked"
                    tone="block"
                  />
                </div>

                <div className="pd-stage-foot">
                  <span>4 of 8 decisions shown</span>
                  <a href="/ledger">
                    Open the basket <Arrow />
                  </a>
                </div>
              </div>

              <aside className="pd-ruling">
                <span className="pd-ruling-kicker">
                  One answer becomes a precedent
                </span>
                <p>
                  “Buy the house blend. The hold-off was only for last month.”
                </p>
                <div className="pd-ruling-meta">
                  <b>#9</b>
                  <span>overrules #8, #1 stays active</span>
                </div>
              </aside>
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

        <section id="how" className="pd-section pd-how">
          <header className="pd-how-head" data-reveal>
            <div>
              <p className="pd-kicker">How it works</p>
              <h2>
                It asks once.
                <br />
                <em>Then it stops asking.</em>
              </h2>
            </div>
            <p className="pd-how-lede">
              You do not fill in a preferences page. You answer the question in
              front of you, in your own words. Precedent keeps the answer and
              applies it the next time the same situation comes around.
            </p>
          </header>

          <ol className="pd-steps" data-reveal-group>
            <Step
              index="01"
              label="You answer a question"
              title="It asks once."
              copy="Oat milk is $11.40 and you have never picked a brand. It asks instead of guessing."
            >
              <div className="pd-slip pd-slip--question">
                <div className="pd-slip-top">
                  <span>One question</span>
                  <span className="pd-stamp">Asked once</span>
                </div>
                <p className="pd-slip-prompt">
                  Oat milk is $11.40 this week. Which one?
                </p>
                <blockquote className="pd-slip-reply">
                  “The good one, when guests are coming.”
                </blockquote>
                <p className="pd-slip-note">Your answer, in your words.</p>
              </div>
            </Step>

            <Step
              index="02"
              label="It writes down the rule"
              title="Your words become a precedent."
              copy="Not a settings toggle. Your words, the situation, and the narrow thing they apply to."
            >
              <div className="pd-slip pd-slip--rule">
                <div className="pd-slip-top">
                  <span>Rule #3</span>
                  <span className="pd-stamp pd-stamp--auto">In force</span>
                </div>
                <blockquote>
                  “The good one, when guests are coming.”
                </blockquote>
                <dl>
                  <div>
                    <dt>Item</dt>
                    <dd>Oat milk</dd>
                  </div>
                  <div>
                    <dt>When</dt>
                    <dd>Guests</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>You, today</dd>
                  </div>
                </dl>
              </div>
            </Step>

            <Step
              index="03"
              label="Next time"
              title="It stops asking."
              copy="Guests come again, so the good oat milk goes in the basket. You see the rule it followed."
            >
              <div className="pd-slip pd-slip--handled">
                <div className="pd-slip-top">
                  <span>This week</span>
                  <span className="pd-state pd-state--handled">
                    <i aria-hidden="true" />
                    Handled
                  </span>
                </div>
                <div className="pd-mini-row">
                  <span className="pd-mini-thumb">
                    <Image
                      src="/products/oat-milk.jpg"
                      alt=""
                      fill
                      sizes="44px"
                    />
                  </span>
                  <span className="pd-mini-main">
                    <b>Oat milk</b>
                    <span>Green Grocer, $11.40</span>
                  </span>
                  <span className="pd-mini-rule">#3</span>
                </div>
                <p className="pd-slip-note">Guests on Saturday. No prompt.</p>
              </div>
            </Step>
          </ol>
        </section>

        <section id="list" className="pd-section pd-list">
          <div className="pd-split">
            <div className="pd-copy" data-reveal>
              <p className="pd-kicker">Your list</p>
              <h2>
                The whole setup is
                <br />
                the stuff you
                <br />
                <em>already buy.</em>
              </h2>
              <p>
                Type one item. Paste the list from your notes app. Upload a file
                from your last shop. Precedent turns the things you buy again
                and again into a weekly basket, and asks only where it does not
                know your rule yet.
              </p>

              <ul className="pd-checks">
                <li>
                  <Check />
                  <span>
                    <b>Type it.</b> Coffee, oat milk, filters, dish soap.
                  </span>
                </li>
                <li>
                  <Check />
                  <span>
                    <b>Paste it.</b> One item per line, straight from your
                    notes.
                  </span>
                </li>
                <li>
                  <Check />
                  <span>
                    <b>Upload it.</b> A CSV or text file from your last order.
                  </span>
                </li>
              </ul>

              <a className="pd-btn pd-btn--primary" href="/ledger#list">
                Add what you buy <Arrow />
              </a>
            </div>

            <div className="pd-list-preview" data-reveal>
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
                  meta="Roaster A, every week"
                  price="$18.00"
                  state="Handled"
                  tone="handled"
                />
                <PreviewRow
                  image="/products/oat-milk.jpg"
                  name="Oat milk"
                  meta="Green Grocer, every week"
                  price="$6.00"
                  state="Rule needed"
                  tone="needed"
                />
                <PreviewRow
                  image="/products/filters-real.jpg"
                  name="Paper filters"
                  meta="Green Grocer, monthly"
                  price="$9.00"
                  state="Handled"
                  tone="handled"
                />
                <PreviewRow
                  image="/products/espresso-pods.jpg"
                  name="Espresso pods"
                  meta="Roaster B, monthly"
                  price="$16.00"
                  state="Handled"
                  tone="handled"
                />
                <PreviewRow
                  image="/products/olive-oil.jpg"
                  name="Olive oil"
                  meta="Green Grocer, monthly"
                  price="$14.00"
                  state="Rule needed"
                  tone="needed"
                />
                <PreviewRow
                  image="/products/dish-soap.jpg"
                  name="Dish soap"
                  meta="Corner shop, every other month"
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
                <span>3 handled, 3 need a rule</span>
                <span>Prices from the demo list</span>
              </div>
            </div>
          </div>
        </section>

        <section id="remembers" className="pd-section pd-remembers">
          <div className="pd-remembers-grid">
            <div className="pd-copy" data-reveal>
              <p className="pd-kicker">Why it remembers</p>
              <h2>
                You correct it once.
                <br />
                <em>It remembers why.</em>
              </h2>
              <p>
                The cheaper beans arrived and were too acidic. You did not edit
                a setting. You told it what happened. The old rule stays on the
                record; the new one takes over.
              </p>
              <p>
                That is the difference between an app that forgets and one that
                learns the way a person does: by being wrong, and being told.
              </p>

              <div className="pd-rule-note">
                <div className="pd-rule-note-top">
                  <span>Your rule</span>
                  <span>#7</span>
                </div>
                <blockquote>
                  “Pay the premium and stay with Roaster A. The cheaper beans
                  were too acidic.”
                </blockquote>
                <p>
                  Written after the order. Cited the next time the price jumps.
                </p>
              </div>
            </div>

            <div className="pd-case" data-reveal data-parallax="0.012">
              <figure className="pd-case-photo">
                <Image
                  src="/products/coffee-cup.jpg"
                  alt="A cup, a notebook and scattered coffee beans on a wooden table."
                  fill
                  sizes="(max-width: 900px) 100vw, 52vw"
                />
                <figcaption>
                  <span>The return</span>
                  <b>Too acidic.</b>
                </figcaption>
              </figure>

              <div className="pd-case-body">
                <div className="pd-case-head">
                  <span>The coffee correction</span>
                  <span className="pd-mono">#2 → #7</span>
                </div>

                <article className="pd-chain-card pd-chain-card--old">
                  <div className="pd-chain-card-top">
                    <span>Original rule</span>
                    <span className="pd-stamp pd-stamp--muted">
                      Superseded
                    </span>
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
                  Nothing deleted. The history is the reason it gets it right
                  next time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="pd-limits-band">
          <section className="pd-section pd-limits">
            <header className="pd-limits-head" data-reveal>
              <div>
                <p className="pd-kicker pd-kicker--light">Your limits</p>
                <h2>
                  It can only go
                  <br />
                  <em>as far as you say.</em>
                </h2>
              </div>
              <p className="pd-limits-lede">
                Rules are preferences. Limits are not. They are checked before
                anything else, and no answer can learn around them.
              </p>
              <div className="pd-limits-seal">
                <Seal />
              </div>
            </header>

            <div className="pd-charter" data-reveal-group>
              <div className="pd-clause" data-reveal>
                <span className="pd-clause-number">01</span>
                <p className="pd-clause-label">A monthly ceiling</p>
                <b className="pd-clause-value">$150</b>
                <p className="pd-clause-copy">
                  When the month’s budget is gone, it stops and tells you.
                </p>
              </div>
              <div className="pd-clause" data-reveal>
                <span className="pd-clause-number">02</span>
                <p className="pd-clause-label">Ask me above</p>
                <b className="pd-clause-value">$100</b>
                <p className="pd-clause-copy">
                  Anything bigger waits for your yes, even if a rule applies.
                </p>
              </div>
              <div className="pd-clause" data-reveal>
                <span className="pd-clause-number">03</span>
                <p className="pd-clause-label">Hard no’s</p>
                <b className="pd-clause-value pd-clause-value--text">
                  No subscriptions
                </b>
                <p className="pd-clause-copy">
                  Blocked before it looks at what it remembers.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="pd-section pd-record">
          <div className="pd-record-grid">
            <div className="pd-copy" data-reveal>
              <p className="pd-kicker">The record</p>
              <h2>
                See everything
                <br />
                <em>it did.</em>
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
                  See the mainnet record
                </a>
              </div>
            </div>

            <div className="pd-receipt" data-reveal>
              <div className="pd-receipt-head">
                <span className="pd-receipt-art" aria-hidden="true">
                  <ReceiptGlyph />
                </span>
                <div>
                  <span>This week</span>
                  <b>6 decisions, 1 needs you</b>
                </div>
                <span className="pd-stamp pd-stamp--muted">Record</span>
              </div>

              <ReceiptRow
                name="House blend beans"
                price="$18.00"
                state="Handled"
                tone="handled"
              />
              <ReceiptRow
                name="Paper filters"
                price="$9.00"
                state="Handled"
                tone="handled"
              />
              <ReceiptRow
                name="Oat milk"
                price="$11.40"
                state="Needs you"
                tone="ask"
              />
              <ReceiptRow
                name="Streaming plan"
                price="$12.00"
                state="Blocked"
                tone="block"
              />
              <ReceiptRow
                name="27 inch display"
                price="$320.00"
                state="Needs you"
                tone="ask"
              />

              <div className="pd-receipt-foot">
                <span>Every line has a reason.</span>
                <a href="/proof">Open the record</a>
              </div>
            </div>
          </div>
        </section>

        <section className="pd-cta">
          <div className="pd-cta-inner">
            <div className="pd-cta-copy" data-reveal>
              <p className="pd-kicker pd-kicker--light">Ready when you are</p>
              <h2>
                Stop deciding
                <br />
                <em>the same thing twice.</em>
              </h2>
              <p>Add your list. Answer once. Let it handle the rest.</p>
              <div className="pd-cta-actions">
                <a className="pd-btn pd-btn--light" href="/ledger">
                  Open the demo <Arrow />
                </a>
                <a className="pd-cta-link" href="/proof">
                  See the record
                </a>
              </div>
            </div>

            <figure className="pd-cta-photo">
              <Image
                src="/products/pantry.jpg"
                alt="A kitchen counter lined with jars, coffee, fruit and paper towels."
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
              />
              <figcaption>
                <span aria-hidden="true">§</span>
                The weekly shop, handled.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="pd-faq">
          <div className="pd-faq-aside" data-reveal>
            <p className="pd-kicker">Questions</p>
            <h2>
              A few things
              <br />
              <em>worth knowing.</em>
            </h2>

            <figure className="pd-faq-photo">
              <Image
                src="/products/grocery-basket.jpg"
                alt="A person unpacking lettuce and cucumbers from a brown paper bag in a kitchen."
                fill
                sizes="(max-width: 900px) 100vw, 34vw"
              />
              <figcaption>Bring the list. Keep the rules.</figcaption>
            </figure>

            <p className="pd-faq-note">
              Still curious? <a href="/ledger">Open the demo</a> and answer one
              question.
            </p>
          </div>

          <div className="pd-faq-list" data-reveal>
            <details className="pd-faq-item" name="precedent-faq" open>
              <summary>
                <span className="pd-faq-question">
                  Do I have to set up rules first?
                </span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                No. Add the things you buy. Precedent asks only where it does
                not know your rule yet.
              </p>
            </details>

            <details className="pd-faq-item" name="precedent-faq">
              <summary>
                <span className="pd-faq-question">
                  What happens when it gets it wrong?
                </span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                Tell it what happened. The old rule stays on the record; the new
                one takes over.
              </p>
            </details>

            <details className="pd-faq-item" name="precedent-faq">
              <summary>
                <span className="pd-faq-question">
                  Can it spend without asking?
                </span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                Only inside your limits. A monthly ceiling, an ask-above amount,
                and hard no’s are checked first.
              </p>
            </details>

            <details className="pd-faq-item" name="precedent-faq">
              <summary>
                <span className="pd-faq-question">
                  Is this a real checkout?
                </span>
                <span className="pd-faq-toggle" aria-hidden="true" />
              </summary>
              <p className="pd-faq-answer">
                No. This is a working demo with a seeded basket. No orders are
                placed. The mainnet record is the separate, append-only evidence
                behind it.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="pd-footer">
        <div className="pd-footer-inner">
          <div className="pd-footer-main">
            <div className="pd-footer-brand-col">
              <a
                className="pd-footer-wordmark"
                href="/"
                aria-label="Precedent home"
              >
                <Wordmark />
              </a>
              <p>The weekly shop, handled.</p>
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

          <p className="pd-footer-credit">
            Photography from Unsplash, Pexels and Pixabay.
          </p>

          <div className="pd-footer-bottom">
            <span>Built for Tatum × Walrus · Track 2</span>
            <span>© 2026 Precedent</span>
            <a href="#top">Back to top</a>
          </div>
        </div>
      </footer>

      <ScrollReveal />
    </div>
  );
}

function LedgerRow({
  image,
  glyph,
  name,
  meta,
  rule,
  state,
  tone,
}: {
  image?: string;
  glyph?: ReactNode;
  name: string;
  meta: string;
  rule: string;
  state: State;
  tone: Tone;
}) {
  return (
    <div className={`pd-row pd-row--${tone}`}>
      {image ? (
        <span className="pd-row-thumb">
          <Image src={image} alt="" fill sizes="42px" />
        </span>
      ) : (
        <span className="pd-row-thumb pd-row-thumb--glyph" aria-hidden="true">
          {glyph}
        </span>
      )}
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
  index,
  label,
  title,
  copy,
  children,
}: {
  index: string;
  label: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <li className="pd-step" data-reveal>
      <div className="pd-step-index" aria-hidden="true">
        <span>{index}</span>
      </div>
      <div className="pd-step-copy">
        <p className="pd-step-label">{label}</p>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      <div className="pd-step-art">{children}</div>
    </li>
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
        <Image src={image} alt="" fill sizes="46px" />
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
    <svg
      className="pd-check"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
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

function PlanGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="11"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M8 20h8M12 16.5V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M10.5 8.8l4 2.2-4 2.2V8.8Z" fill="currentColor" />
    </svg>
  );
}

function ReceiptGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 11.5h6M9 15h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Seal() {
  return (
    <svg
      className="pd-seal-svg"
      viewBox="0 0 260 260"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <path
          id="pd-seal-ring"
          d="M130,130 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0"
        />
      </defs>
      <circle
        cx="130"
        cy="130"
        r="124"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.24"
      />
      <circle
        cx="130"
        cy="130"
        r="106"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.38"
      />
      <text className="pd-seal-ring">
        <textPath href="#pd-seal-ring">
          THE WEEKLY SHOP, HANDLED · ON THE RECORD · THE WEEKLY SHOP, HANDLED ·
        </textPath>
      </text>
      <text
        className="pd-seal-mark"
        x="130"
        y="145"
        textAnchor="middle"
      >
        §
      </text>
      <text
        className="pd-seal-caption"
        x="130"
        y="181"
        textAnchor="middle"
      >
        PRECEDENT
      </text>
    </svg>
  );
}

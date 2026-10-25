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

export function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <a className="lp-brand" href="/" aria-label="Precedent home">
          Precedent<span className="lp-brand-mark">§</span>
        </a>

        <nav className="lp-nav-links" aria-label="Primary">
          <a href="#how">How it works</a>
          <a href="#list">Your list</a>
          <a href="#remembers">Why it remembers</a>
        </nav>

        <a className="lp-nav-cta" href="/ledger">
          Try it <Arrow />
        </a>
      </header>

      <main>
        <section className="lp-hero" data-reveal>
          <p className="lp-eyebrow">
            <span className="lp-live-dot" aria-hidden="true" />
            For the things you buy again and again
          </p>

          <h1>
            The weekly shop,
            <br />
            without the weekly <em>debate</em>.
          </h1>

          <p className="lp-lede">
            Precedent learns the rules you already have — the coffee you like,
            the oat milk you’ll pay extra for, when it should ask — and handles
            the repeat buys.
          </p>

          <div className="lp-actions">
            <a className="lp-btn lp-btn--primary" href="/ledger">
              Try it <Arrow />
            </a>
            <a className="lp-btn lp-btn--ghost" href="#how">
              See how it decides <span className="lp-down" aria-hidden="true">↓</span>
            </a>
          </div>

          <p className="lp-fine">
            No sign-up · Add what you buy · Answer once
          </p>
        </section>

        <section
          className="lp-stage"
          aria-label="A preview of this week's basket"
          data-reveal
        >
          <div className="lp-stage-glow" aria-hidden="true" />
          <div className="lp-stage-grid" aria-hidden="true" />

          <article className="lp-ticket lp-ticket--left">
            <div className="lp-ticket-head">
              <span>This week</span>
              <span className="lp-stamp lp-stamp--auto">Handled</span>
            </div>
            <div className="lp-ticket-photo lp-ticket-photo--art">
              <CoffeeArt />
            </div>
            <h3 className="lp-ticket-title">House blend beans</h3>
            <p className="lp-ticket-meta">Roaster A · every week</p>
            <p className="lp-ticket-reason">
              “House blend is the house standard.”
            </p>
            <p className="lp-ticket-foot">Bought without asking.</p>
          </article>

          <article className="lp-ticket lp-ticket--main">
            <div className="lp-ticket-head">
              <span>Needs you</span>
              <span className="lp-stamp lp-stamp--ask">One question</span>
            </div>
            <div className="lp-ticket-photo lp-ticket-photo--tall lp-ticket-photo--art">
              <OatMilkArt />
            </div>
            <h3 className="lp-ticket-title">Oat milk</h3>
            <p className="lp-ticket-meta">Green Grocer · $11.40 · guests coming</p>
            <div className="lp-rule">
              <span className="lp-rule-cite">No rule yet</span>
              “You’ve never picked a brand. The good one or the cheap one?”
            </div>
            <div className="lp-ticket-actions">
              <a className="lp-mini lp-mini--dark" href="/ledger">
                The good one
              </a>
              <a className="lp-mini" href="/ledger">
                The cheaper one
              </a>
            </div>
            <p className="lp-ticket-foot">Your answer becomes a rule.</p>
          </article>

          <article className="lp-ticket lp-ticket--right">
            <div className="lp-ticket-head">
              <span>This week</span>
              <span className="lp-stamp lp-stamp--block">Blocked</span>
            </div>
            <div className="lp-ticket-photo lp-ticket-photo--art">
              <StreamingArt />
            </div>
            <h3 className="lp-ticket-title">Streaming plan</h3>
            <p className="lp-ticket-meta">Vendor Y · $12.00 · monthly</p>
            <p className="lp-ticket-reason">
              “No subscriptions. That’s a hard limit.”
            </p>
            <p className="lp-ticket-foot">Stopped before it asked.</p>
          </article>

        </section>

        <section id="how" className="lp-chapter lp-chapter--center" data-reveal>
          <p className="lp-kicker">How it works</p>
          <h2>
            It asks once.
            <br />
            Then it stops asking.
          </h2>
          <p className="lp-chapter-lede">
            You don’t fill in a preferences page. You answer the question in
            front of you, in your own words. Precedent keeps the answer and
            applies it the next time the same situation comes around.
          </p>

          <div className="lp-steps">
            <Step
              number="01"
              title="You answer a question."
              copy="Oat milk is $11.40 and you’ve never picked a brand. It asks instead of guessing."
              quote="“The good one, when guests are coming.”"
              art={<QuestionArt />}
            />
            <Step
              number="02"
              title="It writes down the rule."
              copy="Not a settings toggle. Your words, the situation, and the narrow thing they apply to."
              quote="Guests → good oat milk."
              art={<RuleArt />}
            />
            <Step
              number="03"
              title="It stops asking."
              copy="Next time guests come, the good oat milk goes in the basket. You see the rule it followed."
              quote="Handled. No prompt."
              art={<QuietArt />}
            />
          </div>
        </section>

        <section
          id="list"
          className="lp-chapter lp-chapter--split lp-list-feature"
          data-reveal
        >
          <div className="lp-chapter-copy">
            <p className="lp-kicker">Your list</p>
            <h2>
              The whole setup is
              <br />
              the stuff you already buy.
            </h2>
            <p>
              Type one item. Paste the list from your notes app. Upload a file
              from your last shop. Precedent turns the things you buy again and
              again into a weekly basket — and asks only where it doesn’t know
              your rule yet.
            </p>

            <ul className="lp-check-list">
              <li>
                <Check /> <span><b>Type it.</b> Coffee, oat milk, filters, dish soap.</span>
              </li>
              <li>
                <Check /> <span><b>Paste it.</b> One item per line, straight from your notes.</span>
              </li>
              <li>
                <Check /> <span><b>Upload it.</b> A CSV or text file from your last order.</span>
              </li>
            </ul>

            <a className="lp-btn lp-btn--primary" href="/ledger#list">
              Add what you buy <Arrow />
            </a>
          </div>

          <div className="lp-list-preview">
            <div className="lp-list-preview-head">
              <div>
                <p className="lp-basket-kicker">Your list</p>
                <b>6 things</b>
              </div>
              <span className="lp-list-preview-total">$67.50 basket</span>
            </div>

            <PreviewRow
              image="/products/coffee-bag.jpg"
              name="House blend beans"
              meta="Roaster A · every week"
              price="$18.00"
              state="Handled"
            />
            <PreviewRow
              image="/products/oat-milk.jpg"
              name="Oat milk"
              meta="Green Grocer · every week"
              price="$6.00"
              state="Rule needed"
            />
            <PreviewRow
              image="/products/filters-real.jpg"
              name="Paper filters"
              meta="Green Grocer · monthly"
              price="$9.00"
              state="Handled"
            />
            <PreviewRow
              image="/products/espresso-pods.jpg"
              name="Espresso pods"
              meta="Roaster B · monthly"
              price="$16.00"
              state="Handled"
            />
            <PreviewRow
              image="/products/olive-oil.jpg"
              name="Olive oil"
              meta="Green Grocer · monthly"
              price="$14.00"
              state="Rule needed"
            />
            <PreviewRow
              image="/products/dish-soap.jpg"
              name="Dish soap"
              meta="Corner shop · every other month"
              price="$4.50"
              state="Rule needed"
            />

            <div className="lp-list-preview-add">
              <span aria-hidden="true">+</span>
              Add something you buy every week
            </div>
          </div>
        </section>

        <section
          id="remembers"
          className="lp-chapter lp-chapter--split lp-chapter--reverse lp-remembers"
          data-reveal
        >
          <div className="lp-chapter-copy">
            <h2>
              You correct it once.
              <br />
              It remembers why.
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

            <div className="lp-rule-card">
              <div className="lp-rule-card-top">
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

          <div className="lp-story">
            <div className="lp-story-photo">
              <Image
                src="/products/coffee-bag.jpg"
                alt="A bag of Roaster A coffee"
                fill
                sizes="(max-width: 820px) 90vw, 40vw"
              />
            </div>
            <div className="lp-story-item">
              <span>1</span>
              <p>
                <b>You said:</b> switch if the beans jump more than 15%.
              </p>
            </div>
            <div className="lp-story-item">
              <span>2</span>
              <p>
                <b>It switched.</b> The cheaper bag was too acidic.
              </p>
            </div>
            <div className="lp-story-item lp-story-item--accent">
              <span>3</span>
              <p>
                <b>You corrected it.</b> Now it pays the premium — and remembers
                why.
              </p>
            </div>
          </div>
        </section>

        <section
          className="lp-chapter lp-chapter--center lp-limits-section"
          data-reveal
        >
          <p className="lp-kicker">Your limits</p>
          <h2>
            It can only go
            <br />
            as far as you say.
          </h2>
          <p className="lp-chapter-lede">
            Rules are preferences. Limits are not. They are checked before
            anything else, and no answer can learn around them.
          </p>

          <div className="lp-limits">
            <Limit
              title="A monthly ceiling"
              value="$150"
              copy="When the month’s budget is gone, it stops and tells you."
            />
            <Limit
              title="Ask me above"
              value="$100"
              copy="Anything bigger waits for your yes, even if a rule applies."
            />
            <Limit
              title="Hard no’s"
              value="No subscriptions"
              copy="Blocked before it looks at what it remembers."
            />
          </div>
        </section>

        <section
          className="lp-chapter lp-chapter--split lp-receipt-section"
          data-reveal
        >
          <div className="lp-chapter-copy">
            <p className="lp-kicker">The record</p>
            <h2>
              See everything
              <br />
              it did.
            </h2>
            <p>
              Every order, every question, every block. Each line carries the
              rule it rested on, so you can check the reasoning instead of
              trusting a black box.
            </p>
            <a className="lp-btn lp-btn--ghost" href="/ledger">
              Open this week’s basket <Arrow />
            </a>
          </div>

          <div className="lp-receipt">
            <div className="lp-receipt-head">
              <ReceiptArt />
              <div>
                <b>This week</b>
                <span>6 decisions · 1 needs you</span>
              </div>
            </div>

            <ReceiptRow name="House blend beans" price="$18.00" state="Handled" />
            <ReceiptRow name="Paper filters" price="$9.00" state="Handled" />
            <ReceiptRow name="Oat milk" price="$11.40" state="Needs you" />
            <ReceiptRow name="Streaming plan" price="$12.00" state="Blocked" />
            <ReceiptRow name="27 inch display" price="$320.00" state="Needs you" />

            <div className="lp-receipt-foot">
              <span>Every line has a reason.</span>
              <b>Open the record →</b>
            </div>
          </div>
        </section>

        <section className="lp-cta" data-reveal>
          <p className="lp-kicker lp-kicker--light">Ready when you are</p>
          <h2>
            Stop deciding
            <br />
            the same thing twice.
          </h2>
          <p className="lp-cta-sub">
            Add your list. Answer once. Let it handle the rest.
          </p>
          <a className="lp-btn lp-btn--light" href="/ledger">
            Try it <Arrow />
          </a>
          <p className="lp-cta-note">
            No sign-up. Reset the demo whenever you like.
          </p>
        </section>

        <section className="lp-questions" data-reveal>
          <div className="lp-questions-art">
            <img
              src="/illus/groceries.svg"
              alt="A shopper carrying a bag of groceries"
              loading="lazy"
            />
          </div>

          <div className="lp-questions-copy">
            <h2>A few things worth knowing.</h2>

            <div className="lp-faq">
              <details className="lp-faq-item" name="precedent-faq" open>
                <summary>
                  <span>Do I have to set up rules first?</span>
                  <span className="lp-faq-toggle" aria-hidden="true" />
                </summary>
                <p className="lp-faq-answer">
                  No. Add the things you buy. Precedent asks only where it
                  doesn’t know your rule yet.
                </p>
              </details>

              <details className="lp-faq-item" name="precedent-faq">
                <summary>
                  <span>What happens when it gets it wrong?</span>
                  <span className="lp-faq-toggle" aria-hidden="true" />
                </summary>
                <p className="lp-faq-answer">
                  Tell it what happened. The old rule stays on the record; the
                  new one takes over.
                </p>
              </details>

              <details className="lp-faq-item" name="precedent-faq">
                <summary>
                  <span>Can it spend without asking?</span>
                  <span className="lp-faq-toggle" aria-hidden="true" />
                </summary>
                <p className="lp-faq-answer">
                  Only inside your limits. A monthly ceiling, an ask-above
                  amount, and hard no’s are checked first.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer" data-reveal>
        <div className="lp-footer-inner">
          <div className="lp-footer-main">
            <div className="lp-footer-brand-col">
              <a className="lp-footer-wordmark" href="/">
                Precedent<span>§</span>
              </a>
              <p>The weekly shop, handled.</p>
            </div>

            <div className="lp-footer-cols">
              <div>
                <p className="lp-footer-col-title">Product</p>
                <a href="#how">How it works</a>
                <a href="#list">Your list</a>
                <a href="/ledger">Open the app</a>
              </div>
              <div>
                <p className="lp-footer-col-title">Proof</p>
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

          <div className="lp-footer-bottom">
            <span>Built for Tatum × Walrus · Track 2</span>
            <span>© 2026 Precedent</span>
          </div>
        </div>
      </footer>

      <ScrollReveal />
    </div>
  );
}

function Step({
  number,
  title,
  copy,
  quote,
  art,
}: {
  number: string;
  title: string;
  copy: string;
  quote: string;
  art: ReactNode;
}) {
  return (
    <article className="lp-step">
      <div className="lp-step-art">{art}</div>
      <span className="lp-step-number">{number}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <blockquote>{quote}</blockquote>
    </article>
  );
}

function Limit({
  title,
  value,
  copy,
}: {
  title: string;
  value: string;
  copy: string;
}) {
  return (
    <article className="lp-limit">
      <p>{title}</p>
      <b>{value}</b>
      <span>{copy}</span>
    </article>
  );
}

function PreviewRow({
  image,
  name,
  meta,
  price,
  state,
}: {
  image: string;
  name: string;
  meta: string;
  price: string;
  state: 'Handled' | 'Rule needed';
}) {
  return (
    <div className="lp-lrow">
      <div className="lp-lrow-photo">
        <Image src={image} alt="" fill sizes="48px" />
      </div>
      <div className="lp-lrow-main">
        <b>{name}</b>
        <span>{meta}</span>
      </div>
      <div className="lp-lrow-right">
        <b>{price}</b>
        <em className={state === 'Handled' ? 'is-handled' : 'is-needed'}>
          {state}
        </em>
      </div>
    </div>
  );
}

function ReceiptRow({
  name,
  price,
  state,
}: {
  name: string;
  price: string;
  state: 'Handled' | 'Needs you' | 'Blocked';
}) {
  return (
    <div className="lp-rrow">
      <span>{name}</span>
      <b>{price}</b>
      <em
        className={
          state === 'Handled'
            ? 'is-handled'
            : state === 'Blocked'
              ? 'is-blocked'
              : 'is-needed'
        }
      >
        {state}
      </em>
    </div>
  );
}

function Check() {
  return (
    <svg className="lp-check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
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
      className="lp-arrow"
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



import { ProofCheck } from '../../components/proof-check.tsx';

export const metadata = {
  title: 'The record',
  description:
    'The append-only Walrus Memory record behind Precedent, verified through Tatum’s Sui GraphQL gateway.',
};

const CHECKPOINT = '337,592,300';
const ACCOUNT = '0x9ed016de2fbfa51d73363495e7158e40f8761a0c253c9198c430423d624f6d55';
const DELEGATE = '43d54a89a0aadd1a1ef32233c86e14347a87afc1b109ff0cbacc700ca9c276ca';
const EXPLORER = `https://suivision.xyz/object/${ACCOUNT}`;
const REPO = 'https://github.com/Daveboss123/precedent';

export default function ProofPage() {
  return (
    <div className="pf">
      <a className="pf-skip" href="#record">
        Skip to the record
      </a>

      <header className="pf-nav">
        <a className="pf-brand" href="/" aria-label="Precedent home">
          Precedent<span>§</span>
        </a>

        <nav className="pf-nav-links" aria-label="Proof page">
          <a href="#record">
            The record
          </a>
          <a href="#verify">
            Verify it
          </a>
        </nav>

        <div className="pf-nav-actions">
          <a className="pf-nav-product" href="/">
            Product
          </a>
          <a className="pf-nav-cta" href="/ledger">
            Open the app
          </a>
        </div>
      </header>

      <main className="pf-main" id="record">
        <section className="pf-hero">
          <span className="pf-folio" aria-hidden="true">
            Exhibit A · The record
          </span>

          <div className="pf-hero-copy">
            <p className="pf-eyebrow">
              <span className="pf-live-dot" aria-hidden="true" />
              The evidence behind the demo
            </p>

            <h1>
              Twenty memories.
              <br />
              One record,
              <br />
              <em>append-only.</em>
            </h1>

            <p className="pf-lede">
              Precedent’s rules do not live in a settings database. The mainnet
              record holds twenty rule, correction, and outcome memories written
              through Walrus Memory on Sui. This page asks Tatum’s gateway to
              confirm that the record is still there.
            </p>

            <div className="pf-hero-foot">
              <span>
                <b>Walrus Memory</b>
                The store
              </span>
              <span>
                <b>Tatum</b>
                The check
              </span>
              <span>
                <b>Sui mainnet</b>
                The source
              </span>
            </div>
          </div>

          <aside className="pf-dossier" aria-label="Record summary">
            <div className="pf-dossier-head">
              <span>MemWal account</span>
              <span className="pf-stamp">Sui mainnet</span>
            </div>

            <div className="pf-dossier-body">
              <div className="pf-datum">
                <span>Network</span>
                <b>Sui mainnet</b>
              </div>
              <div className="pf-datum">
                <span>Namespace</span>
                <b className="pf-mono">precedent</b>
              </div>
              <div className="pf-datum">
                <span>Memories</span>
                <b className="pf-datum-big">20</b>
              </div>
              <div className="pf-datum">
                <span>First verified</span>
                <b className="pf-mono">#{CHECKPOINT}</b>
              </div>

              <div className="pf-datum pf-datum--wide">
                <span>MemWal account</span>
                <b className="pf-mono pf-id">{ACCOUNT}</b>
              </div>
              <div className="pf-datum pf-datum--wide">
                <span>Delegate key</span>
                <b className="pf-mono pf-id">{DELEGATE}</b>
              </div>
            </div>

            <div className="pf-dossier-foot">
              <span>
                <i aria-hidden="true" />
                Checked live below
              </span>
              <a href={EXPLORER} target="_blank" rel="noreferrer">
                SuiVision <span aria-hidden="true">↗</span>
              </a>
            </div>
          </aside>
        </section>

        <ProofCheck />

        <section className="pf-section pf-trust" aria-labelledby="pf-trust-title">
          <div className="pf-section-head">
            <p className="pf-kicker">Read the badge</p>
            <h2 id="pf-trust-title">
              Know exactly
              <br />
              what this <em>proves.</em>
            </h2>
            <p>
              A verification badge is only useful if it is specific about its
              edges. Here is what the live check above confirms — and what it
              leaves to you.
            </p>
          </div>

          <div className="pf-trust-grid">
            <article className="pf-truth pf-truth--yes">
              <header>
                <span className="pf-truth-mark" aria-hidden="true">
                  <CheckIcon />
                </span>
                <h3>What this check confirms</h3>
              </header>
              <ul>
                <li>
                  The MemWal account object exists on Sui mainnet at the
                  checkpoint shown above.
                </li>
                <li>
                  The account is active, not frozen, and returns onchain
                  content.
                </li>
                <li>
                  When an agent key is configured, that delegate is registered
                  to the account.
                </li>
                <li>
                  Tatum’s Sui GraphQL gateway answered at the time shown.
                </li>
              </ul>
            </article>

            <article className="pf-truth pf-truth--no">
              <header>
                <span className="pf-truth-mark" aria-hidden="true">
                  <MinusIcon />
                </span>
                <h3>What it does not</h3>
              </header>
              <ul>
                <li>
                  It does not prove that every memory is correct, or that a
                  particular order happened.
                </li>
                <li>
                  It does not verify the public demo’s basket. That store is
                  separate and resettable.
                </li>
                <li>
                  It does not replace reading the account on a public explorer
                  yourself.
                </li>
                <li>
                  It does not make this a checkout. No orders are placed.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="pf-section pf-shelf" aria-labelledby="pf-shelf-title">
          <div className="pf-shelf-head">
            <div>
              <p className="pf-kicker">In the record</p>
              <h2 id="pf-shelf-title">
                What a household
                <br />
                <em>remembers.</em>
              </h2>
            </div>
            <p>
              Not a preferences file. A history of decisions, kept in the
              words that made them — including the ones that were later
              overruled.
            </p>
          </div>

          <ol className="pf-shelf-list">
            <li>
              <span className="pf-shelf-index">01</span>
              <div className="pf-shelf-item">
                <b>Rules</b>
                <p>
                  What to buy, switch, or skip — in the words the user actually
                  used.
                </p>
              </div>
              <span className="pf-shelf-tag">Written in your words</span>
            </li>
            <li>
              <span className="pf-shelf-index">02</span>
              <div className="pf-shelf-item">
                <b>Corrections</b>
                <p>
                  The old rule stays on the record. The new one supersedes it.
                  Nothing is erased.
                </p>
              </div>
              <span className="pf-shelf-tag">Superseded, never deleted</span>
            </li>
            <li>
              <span className="pf-shelf-index">03</span>
              <div className="pf-shelf-item">
                <b>Outcomes</b>
                <p>
                  What happened after the order, including the returns that
                  changed the rule.
                </p>
              </div>
              <span className="pf-shelf-tag">The reason why</span>
            </li>
            <li>
              <span className="pf-shelf-index">04</span>
              <div className="pf-shelf-item">
                <b>Observations</b>
                <p>
                  The context around a decision: guests, a price jump, a month
                  that called for restraint.
                </p>
              </div>
              <span className="pf-shelf-tag">Context, kept</span>
            </li>
            <li>
              <span className="pf-shelf-index">05</span>
              <div className="pf-shelf-item">
                <b>Audit findings</b>
                <p>
                  Where two rules disagree, and which one still governs the
                  basket.
                </p>
              </div>
              <span className="pf-shelf-tag">Conflicts, resolved</span>
            </li>
          </ol>
        </section>

        <section className="pf-section pf-verify" id="verify" aria-labelledby="pf-verify-title">
          <div className="pf-verify-copy">
            <p className="pf-kicker">Verify it yourself</p>
            <h2 id="pf-verify-title">
              Don’t take the
              <br />
              badge’s <em>word</em> for it.
            </h2>
            <p>
              Open the account on SuiVision. Check the delegate key. Run the
              Tatum check above and compare the checkpoint. Nothing on this
              page is a screenshot.
            </p>

            <div className="pf-actions">
              <a
                className="pf-btn pf-btn--dark"
                href={EXPLORER}
                target="_blank"
                rel="noreferrer"
              >
                Open SuiVision <span aria-hidden="true">↗</span>
              </a>
              <a
                className="pf-btn pf-btn--ghost"
                href={REPO}
                target="_blank"
                rel="noreferrer"
              >
                Read the source
              </a>
            </div>

            <p className="pf-smallprint">
              The public app is a separate, resettable demo. The mainnet record
              is append-only and is never changed by the demo.
            </p>
          </div>

          <ol className="pf-steps">
            <li>
              <span>01</span>
              <div>
                <b>Open the account.</b>
                <p>Find the MemWal account object on SuiVision.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <b>Check the delegate.</b>
                <p>Confirm the agent key above is registered to the account.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <b>Compare the checkpoint.</b>
                <p>Run the Tatum check and compare it with the explorer.</p>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <footer className="pf-footer">
        <div className="pf-footer-inner">
          <div className="pf-footer-main">
            <div className="pf-footer-brand">
              <a className="pf-footer-wordmark" href="/">
                Precedent<span>§</span>
              </a>
              <p>The weekly shop, handled.</p>
              <span>Proof, not decoration.</span>
            </div>

            <div className="pf-footer-links">
              <a href="/">Product</a>
              <a href="/ledger">Open the app</a>
              <a href={EXPLORER} target="_blank" rel="noreferrer">
                SuiVision
              </a>
              <a href={REPO} target="_blank" rel="noreferrer">
                Source
              </a>
            </div>
          </div>

          <div className="pf-footer-bottom">
            <span>Built for Tatum × Walrus · Track 2</span>
            <span>© 2026 Precedent</span>
            <a href="#record">
              Back to the record <span aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
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

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path
        d="M3.5 8h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

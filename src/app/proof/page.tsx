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
    <div className="proof">
      <header className="proof-nav">
        <a className="proof-brand" href="/">
          Precedent<span>§</span>
        </a>
        <a className="btn btn--dark" href="/ledger">
          Open the app
        </a>
      </header>

      <main className="proof-main">
        <p className="proof-kicker">The record</p>
        <h1>
          20 memories.
          <br />
          One append-only record.
        </h1>
        <p className="proof-lede">
          Every rule, correction, and outcome lives in Walrus Memory on Sui
          mainnet. Tatum’s Sui GraphQL gateway checks the account and its
          delegate.
        </p>

        <ProofCheck />

        <section className="proof-grid" aria-label="Record details">
          <div>
            <span>Network</span>
            <b>Sui mainnet</b>
          </div>
          <div>
            <span>Namespace</span>
            <b className="proof-mono">precedent</b>
          </div>
          <div>
            <span>Memories</span>
            <b>20</b>
          </div>
          <div>
            <span>First verified</span>
            <b className="proof-mono">#{CHECKPOINT}</b>
          </div>
          <div className="proof-grid-wide">
            <span>Account</span>
            <b className="proof-mono">{ACCOUNT}</b>
          </div>
          <div className="proof-grid-wide">
            <span>Delegate</span>
            <b className="proof-mono">{DELEGATE}</b>
          </div>
        </section>

        <section className="proof-section">
          <p className="proof-kicker">What is stored</p>
          <h2>Not a settings file.</h2>
          <div className="proof-list">
            <div>
              <b>Rules</b>
              <span>
                What to buy, switch, or skip — in the words the user actually
                used.
              </span>
            </div>
            <div>
              <b>Corrections</b>
              <span>
                The old rule stays on the record. The new one supersedes it.
              </span>
            </div>
            <div>
              <b>Outcomes</b>
              <span>What happened after the order, including the returns.</span>
            </div>
            <div>
              <b>Observations</b>
              <span>The context that explains why a rule changed.</span>
            </div>
            <div>
              <b>Audit findings</b>
              <span>Where two rules disagree, and which one still governs.</span>
            </div>
          </div>
        </section>

        <section className="proof-section proof-section--verify">
          <div>
            <p className="proof-kicker">Verify it yourself</p>
            <h2>The record is the proof.</h2>
            <p>
              Open the account on SuiVision, check the delegate key, then run
              the Tatum check above. Nothing here is a screenshot.
            </p>
            <div className="proof-actions">
              <a
                className="btn btn--dark"
                href={EXPLORER}
                target="_blank"
                rel="noreferrer"
              >
                Open SuiVision →
              </a>
              <a
                className="btn"
                href={REPO}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </div>
          </div>
          <ol className="proof-steps">
            <li>
              <span>01</span>
              <p>Open the MemWal account on SuiVision.</p>
            </li>
            <li>
              <span>02</span>
              <p>Confirm the delegate key is registered.</p>
            </li>
            <li>
              <span>03</span>
              <p>Run the Tatum check and compare the checkpoint.</p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="proof-footer">
        <a href="/">← Back to Precedent</a>
        <span>Built for Tatum × Walrus · Track 2</span>
      </footer>
    </div>
  );
}

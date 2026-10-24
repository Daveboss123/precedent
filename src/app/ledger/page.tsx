import type { Metadata } from 'next';

import { Ledger } from '../../components/ledger.tsx';

export const metadata: Metadata = {
  title: 'The ledger',
  description:
    'The live decision queue, the precedent record, the Auditor and the charter.',
};

export default function Page() {
  return <Ledger />;
}

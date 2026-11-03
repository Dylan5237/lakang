import { useState } from 'react';
import { clearKey } from './lib/api';
import { hrefs, navigate, parseHash, useHash } from './lib/router';
import type { Archive } from './types';
import { CaseView } from './components/CaseView';
import { Home } from './components/Home';
import { LockScreen } from './components/LockScreen';

export function App() {
  const [archive, setArchive] = useState<Archive | null>(null);
  const route = parseHash(useHash());
  if (!archive) return <LockScreen onOpen={setArchive} />;
  const lock = () => { clearKey(); setArchive(null); navigate(hrefs.home(), true); };
  const c = route.name === 'case' ? archive.cases.find((x) => x.id === route.caseId) : undefined;
  if (route.name === 'case' && c) return <CaseView c={c} tab={route.tab} sectionId={route.sectionId} />;
  return <Home archive={archive} onLock={lock} />;
}

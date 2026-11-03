import { useState } from 'react';
import { clearKey } from './lib/api';
import { hrefs, navigate, parseHash, useHash } from './lib/router';
import type { Archive } from './types';
import { CardsPage } from './components/CardsPage';
import { Flashcards } from './components/Flashcards';
import { CaseView } from './components/CaseView';
import { Home } from './components/Home';
import { LockScreen } from './components/LockScreen';
import { TermsPage } from './components/TermsPage';

export function App() {
  // The clinical archive is private: only case routes need it, everything else is public study content.
  const [archive, setArchive] = useState<Archive | null>(null);
  const route = parseHash(useHash());
  if (route.name === 'case') {
    const c = archive?.cases.find((x) => x.id === route.caseId);
    if (archive && c) return <CaseView c={c} tab={route.tab} sectionId={route.sectionId} />;
    return <LockScreen onOpen={setArchive} />;
  }
  if (route.name === 'terms') return <TermsPage termId={route.termId} />;
  if (route.name === 'cards') return <CardsPage cardId={route.cardId} />;
  if (route.name === 'review') return <Flashcards />;
  const lock = () => { clearKey(); setArchive(null); navigate(hrefs.home(), true); };
  return <Home archive={archive} onLock={lock} />;
}

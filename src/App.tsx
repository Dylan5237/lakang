import { useState } from 'react';
import { clearKey } from './lib/api';
import { hrefs, navigate, parseHash, useHash, type Route } from './lib/router';
import type { Archive } from './types';
import { CardsPage } from './components/CardsPage';
import { Flashcards } from './components/Flashcards';
import { CaseView } from './components/CaseView';
import { Home } from './components/Home';
import { LockScreen } from './components/LockScreen';
import { PathsPage } from './components/PathsPage';
import { AboutPage } from './components/AboutPage';
import { MePage } from './components/MePage';
import { TermsPage } from './components/TermsPage';
import { AskAI } from './components/AskAI';
import { TAB_ROUTES, TabBar } from './components/TabBar';

export function App() {
  const route = parseHash(useHash());
  const tabbed = TAB_ROUTES.has(route.name);
  // Same element position for every route so the unlocked archive state in Routes survives tab switches.
  return <><div className={tabbed ? 'with-tabs' : undefined}><Routes route={route} /></div>{tabbed && <TabBar current={route.name} />}<AskAI enabled={route.name !== 'case'} /></>;
}

function Routes({ route }: { route: Route }) {
  // The clinical archive is private: only case routes need it, everything else is public study content.
  const [archive, setArchive] = useState<Archive | null>(null);
  if (route.name === 'case') {
    const c = archive?.cases.find((x) => x.id === route.caseId);
    if (archive && c) return <CaseView c={c} tab={route.tab} sectionId={route.sectionId} />;
    return <LockScreen onOpen={setArchive} />;
  }
  if (route.name === 'terms') return <TermsPage termId={route.termId} />;
  if (route.name === 'cards') return <CardsPage cardId={route.cardId} />;
  if (route.name === 'review') return <Flashcards />;
  if (route.name === 'paths') return <PathsPage pathId={route.pathId} />;
  if (route.name === 'about') return <AboutPage />;
  if (route.name === 'me') return <MePage />;
  const lock = () => { clearKey(); setArchive(null); navigate(hrefs.home(), true); };
  return <Home archive={archive} onLock={lock} />;
}

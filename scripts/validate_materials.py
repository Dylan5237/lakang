#!/usr/bin/env python3
"""Validate active/archive cards, official transcriptions, series and agenda invariants."""
from __future__ import annotations
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)
def load(name: str):
    return json.loads((ROOT / 'content' / name).read_text(encoding='utf-8'))
def unique_ids(rows: list, label: str) -> set[str]:
    require(isinstance(rows, list), f'{label}: expected list')
    ids = [row['id'] for row in rows]
    require(len(ids) == len(set(ids)), f'{label}: duplicate IDs')
    return set(ids)
def main() -> None:
    originals = [load(f'official/P{i:02}.json') for i in range(1, 5)]
    require(unique_ids(originals, 'official articles') == {f'P{i:02}' for i in range(1, 5)}, 'Four original articles required')
    source_rows = load('sources.json')['sources'] + load('sources-extension.json')
    sources = unique_ids(source_rows, 'sources') | {a['sourceId'] for a in originals}
    require(sources == {f'S{i:02}' for i in range(1, 54)}, 'Sources must contain S01-S53')
    for source in source_rows:
        require(source['url'].startswith('https://'), f"Invalid source URL: {source['id']}")
    chapter_text = '\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT / 'content').glob('chapters-*.md')))
    chapter_list = re.findall(r'^## (r\d{2})｜', chapter_text, flags=re.M)
    chapters = set(chapter_list)
    require(chapters == {f'r{i:02}' for i in range(1, 17)} and len(chapters) == len(chapter_list), 'Keep 16 unique archive chapters')
    for sid in re.findall(r'\[(S\d{2})\]', chapter_text):
        require(sid in sources, f'Unknown chapter source: {sid}')
    speaker_list = re.findall(r'^## (expert-[a-z]+)｜', (ROOT / 'content' / 'speakers.md').read_text(encoding='utf-8'), flags=re.M)
    speakers = set(speaker_list)
    require(len(speakers) == len(speaker_list) == 10, 'Must contain 10 unique speakers')
    agenda = load('agenda.json')
    require(agenda['timezone'] == 'Asia/Shanghai', 'Conference timezone must be Asia/Shanghai')
    sessions = unique_ids(agenda['sessions'], 'sessions')
    require(len(sessions) == 15, 'Retain 15 agenda blocks')
    for row in agenda['sessions']:
        require(row['date'] == f"2026-10-{row['day']:02}", f"Date mismatch: {row['id']}")
        start = datetime.fromisoformat(row['date'] + 'T' + row['start'] + ':00+08:00')
        end = datetime.fromisoformat(row['date'] + 'T' + row['end'] + ':00+08:00')
        require(end > start, f"Invalid time range: {row['id']}")
        require(set(row['speakerIds']) <= speakers, f"Unknown speaker: {row['id']}")
        if row['day'] == 29 and row['start'] >= '14:00':
            require(row['venue'] == '会议楼Ⅱ 401 室', 'October 29 venue lost')
        if row['day'] == 28 and row['start'] < '12:00':
            require('冼为坚' in row['venue'], 'October 28 venue lost')
    keynote = next(row for row in agenda['sessions'] if row['id'] == 'd28-keynotes')
    require((keynote['start'], keynote['end']) == ('09:30', '12:00'), 'Keynote time changed')
    require(len(keynote['talks']) == 2, 'Both keynote titles must remain')
    require(all('start' not in talk and 'end' not in talk for talk in keynote['talks']), 'No invented separate keynote times')
    examples = load('card-examples.json')['cards']
    unique_ids(examples, 'example cards')
    cards = []
    for path in sorted((ROOT / 'content' / 'cards').glob('*.json')):
        rows = json.loads(path.read_text(encoding='utf-8'))
        require(isinstance(rows, list), f'{path.name}: expected list')
        cards.extend(rows)
    card_ids = unique_ids(cards, 'all cards')
    require(card_ids == {f'K{i:03}' for i in range(1, 122)} - {'K022', 'K023', 'K024'}, 'Preserve old IDs and add K104-K121')
    by_id = {c['id']: c for c in cards}
    order = load('reading-order.json')
    retired = load('retired-card-ids.json')
    require(len(order) == len(set(order)) == 100, 'Exactly 100 active cards')
    require(len(retired) == len(set(retired)) == 18, 'Exactly 18 archived cards')
    require(not set(order) & set(retired) and set(order) | set(retired) == card_ids, 'Active/archive must partition all IDs')
    require(order[:4] == ['K001', 'K002', 'K003', 'K004'], 'Keep opening route')
    require(order[4:22] == [f'K{i:03}' for i in range(104, 122)], 'Official cards follow the four opening cards')
    term_rows = load('terms.json') + load('terms-extension.json')
    terms = unique_ids(term_rows, 'terms')
    require(terms == {f'T{i:02}' for i in range(1, 27)}, 'Must contain T01-T26')
    for card in examples + cards:
        require(bool(card['title']) and bool(card['body']), f"Empty card: {card['id']}")
        for field, allowed in [('sourceIds', sources), ('chapterIds', chapters), ('speakerIds', speakers), ('sessionIds', sessions)]:
            require(set(card[field]) <= allowed, f"Broken {field}: {card['id']}")
        require('来源真实性' not in card['body'], f"Editorial label in body: {card['id']}")
    for card in cards:
        require(set(card.get('relatedCardIds', [])) <= card_ids, f"Broken related card: {card['id']}")
        require(card['id'] not in card.get('relatedCardIds', []), f"Self reference: {card['id']}")
        require(set(card.get('termIds', [])) <= terms, f"Broken term: {card['id']}")
        require(set(card.get('locators', {})) <= set(card['sourceIds']), f"Orphan locator: {card['id']}")
        for cid in re.findall(r'\bK\d{3}\b', json.dumps(card, ensure_ascii=False)):
            require(cid in card_ids, f"Unknown embedded card: {card['id']} -> {cid}")
    for row in term_rows + load('shelf.json'):
        require(set(row['sourceIds']) <= sources, f"Broken reference: {row['id']}")
        require(set(row.get('cardIds', [])) <= card_ids, f"Broken term card: {row['id']}")
    series = load('series.json')
    require(len(unique_ids(series, 'series')) == 6, 'Must contain six series')
    seen = []
    for item in series:
        require(len(item['cardIds']) == 5, f"Five readings per series: {item['id']}")
        require(set(item['cardIds'] + item['foundationIds']) <= set(order), f"Series must retain active foundations: {item['id']}")
        require(set(item['sessionIds']) <= sessions, f"Broken series session: {item['id']}")
        seen.extend(item['cardIds'])
    require(len(seen) == len(set(seen)) == 30 and set(seen) == {f'K{i:03}' for i in range(74, 104)}, 'Keep all 30 series readings')
    digests = load('official/text-digests.json')
    registry = load('official/pdf-registry.json')
    require(set(registry) <= {a['id'] for a in originals}, 'Unknown PDF registry key')
    official_ids = []
    for article in originals:
        aid = article['id']
        require(article['speakerId'] in speakers and set(article['sessionIds']) <= sessions, f'Broken article links: {aid}')
        require(re.fullmatch(r'[0-9a-f]{64}', article['sha256']) is not None, f'Invalid PDF SHA: {aid}')
        require(bool(article['byline'] and article['publisher'] and article['publishedAt']), f'Attribution missing: {aid}')
        paragraphs = article['paragraphs']
        pids = unique_ids(paragraphs, f'{aid} paragraphs')
        require(all(1 <= p['page'] <= article['pageCount'] and p['text'] for p in paragraphs), f'Invalid original page: {aid}')
        original_text = ''.join(p.get('heading', '') + p['text'] for p in paragraphs)
        normalized = re.sub(r'\s+', '', original_text)
        require(hashlib.sha256(normalized.encode('utf-8')).hexdigest() == digests[aid]['sha256'], f'Original transcription differs from supplied PDF: {aid}')
        require(len(normalized) == digests[aid]['charactersWithoutWhitespace'], f'Original character count: {aid}')
        for cid in article['cardIds']:
            require(cid in order, f'Official card not active: {cid}')
            card = by_id[cid]
            require(card.get('officialArticleId') == aid and card['stage'] == 'official', f'Wrong article: {cid}')
            require(card['sourceIds'] == [article['sourceId']], f'Official card silently borrows other sources: {cid}')
            require(card.get('evidenceIds') and set(card['evidenceIds']) <= pids, f'Missing original locator: {cid}')
            official_ids.append(cid)
        if aid in registry:
            require(registry[aid] == f'./originals/{aid}.pdf', f'Unsafe PDF path: {aid}')
            pdf = ROOT / 'public' / 'originals' / f'{aid}.pdf'
            require(pdf.is_file() and hashlib.sha256(pdf.read_bytes()).hexdigest() == article['sha256'], f'Missing or altered PDF: {aid}')
    require(len(official_ids) == len(set(official_ids)) == 18 and set(official_ids) == {f'K{i:03}' for i in range(104, 122)}, 'Exactly 18 official cards')
    print(f'PASS: 100 active cards; 18 archived; 4 official articles; 18 official cards; {len(terms)} terms; {len(sources)} sources; 6 series; 15 agenda blocks; transcription hashes match')
    print('Structure and transcription integrity do not establish theoretical agreement or reader comprehension.')
if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, StopIteration) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        sys.exit(1)

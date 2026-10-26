#!/usr/bin/env python3
"""Validate the handoff content using only Python's standard library."""
from __future__ import annotations
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)

def load(name: str) -> dict:
    value = json.loads((ROOT / 'content' / name).read_text(encoding='utf-8'))
    require(isinstance(value, dict), f'{name}: expected JSON object')
    return value

def unique_ids(rows: list, label: str) -> set[str]:
    require(isinstance(rows, list), f'{label}: expected list')
    ids = [row['id'] for row in rows]
    require(len(ids) == len(set(ids)), f'{label}: duplicate IDs')
    return set(ids)

def main() -> None:
    source_data = load('sources.json')
    sources = unique_ids(source_data['sources'], 'sources')
    require(sources == {f'S{i:02}' for i in range(1, 26)}, 'Source baseline must contain S01-S25')
    for source in source_data['sources']:
        require(source['url'].startswith('https://'), f"Invalid source URL: {source['id']}")

    chapter_text = '\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT / 'content').glob('chapters-*.md')))
    chapter_list = re.findall(r'^## (r\d{2})｜', chapter_text, flags=re.M)
    chapters = set(chapter_list)
    require(chapters == {f'r{i:02}' for i in range(1, 17)}, 'Must contain all 16 source chapters')
    require(len(chapter_list) == len(chapters), 'Duplicate source chapter')
    for sid in re.findall(r'\[(S\d{2})\]', chapter_text):
        require(sid in sources, f'Unknown chapter source: {sid}')

    speaker_text = (ROOT / 'content' / 'speakers.md').read_text(encoding='utf-8')
    speaker_list = re.findall(r'^## (expert-[a-z]+)｜', speaker_text, flags=re.M)
    speakers = set(speaker_list)
    require(len(speakers) == len(speaker_list) == 10, 'Must contain 10 unique speakers')

    agenda = load('agenda.json')
    require(agenda['timezone'] == 'Asia/Shanghai', 'Conference timezone must be Asia/Shanghai')
    sessions = unique_ids(agenda['sessions'], 'sessions')
    require(len(sessions) == 15, 'Baseline must retain 15 agenda blocks')
    for row in agenda['sessions']:
        require(row['date'] == f"2026-10-{row['day']:02}", f"Date mismatch: {row['id']}")
        start = datetime.fromisoformat(row['date'] + 'T' + row['start'] + ':00+08:00')
        end = datetime.fromisoformat(row['date'] + 'T' + row['end'] + ':00+08:00')
        require(end > start, f"Invalid time range: {row['id']}")
        require(set(row['speakerIds']) <= speakers, f"Unknown speaker: {row['id']}")
        if row['day'] == 29 and row['start'] >= '14:00':
            require(row['venue'] == '会议楼Ⅱ 401 室', 'October 29 afternoon/evening venue lost')
        if row['day'] == 28 and row['start'] < '12:00':
            require('冼为坚' in row['venue'], 'October 28 morning venue lost')
    keynote = next(row for row in agenda['sessions'] if row['id'] == 'd28-keynotes')
    require((keynote['start'], keynote['end']) == ('09:30', '12:00'), 'Keynote shared time changed')
    require(len(keynote['talks']) == 2, 'Both keynote titles must be retained')
    require(all('start' not in talk and 'end' not in talk for talk in keynote['talks']), 'Do not invent separate keynote times')

    cards = load('card-examples.json')['cards']
    unique_ids(cards, 'example cards')
    for card in cards:
        require(bool(card['title']) and bool(card['body']), f"Empty card: {card['id']}")
        for field, allowed in [('sourceIds', sources), ('chapterIds', chapters), ('speakerIds', speakers), ('sessionIds', sessions)]:
            require(set(card[field]) <= allowed, f"Broken {field}: {card['id']}")
        require('来源真实性' not in card['body'], f"Editorial label in public body: {card['id']}")

    print(f'PASS: {len(chapters)} chapters, {len(speakers)} speakers, {len(sources)} sources, {len(sessions)} agenda blocks, {len(cards)} example cards')
    print('This validates structure and fixed handoff constraints, not external source truth or website behavior.')

if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, StopIteration) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        sys.exit(1)

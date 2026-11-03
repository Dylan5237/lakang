#!/usr/bin/env python3
"""把临床演示记录 HTML 转成站点使用的 JSON。

记录本身是私人资料：输入和输出都不进仓库，输出只上传到服务器受密码保护的路径。
用法：python scripts/build_clinical.py <记录.html> <输出.json>
"""
from __future__ import annotations
import html
import json
import re
import sys
from html.parser import HTMLParser

ROLE = {'lacan': 'analyst', 'patient': 'patient', 'supervisor': 'supervisor', 'doctor': 'doctor', 'interp': 'note'}
DOT_ROLE = {'--lacan': 'analyst', '--patient': 'patient', '--supervisor': 'supervisor', '--interp': 'note', '#3a7a5a': 'doctor', '--doctor': 'doctor'}
RICH_TAGS = {'b', 'br', 'ul', 'li'}


class Node:
    def __init__(self, tag: str, attrs: dict, parent: 'Node | None'):
        self.tag, self.attrs, self.parent, self.children = tag, attrs, parent, []

    @property
    def classes(self) -> set[str]:
        return set(self.attrs.get('class', '').split())

    def find_all(self, pred):
        for c in self.children:
            if isinstance(c, Node):
                if pred(c):
                    yield c
                yield from c.find_all(pred)

    def text(self) -> str:
        return ''.join(c if isinstance(c, str) else ('\n' if c.tag == 'br' else c.text()) for c in self.children)


class Tree(HTMLParser):
    VOID = {'br', 'meta', 'link', 'img', 'hr', 'input'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root', {}, None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs), self.cur)
        self.cur.children.append(node)
        if tag not in self.VOID:
            self.cur = node

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def squash(s: str) -> str:
    return re.sub(r'[ \t\r\f\v]+', ' ', re.sub(r'\s*\n\s*', '\n', s)).strip()


def rich(node: Node) -> str:
    """Whitelisted inline HTML (b/br/ul/li); everything else is escaped text."""
    out = []
    for c in node.children:
        if isinstance(c, str):
            out.append(html.escape(re.sub(r'\s+', ' ', c)))
        elif c.tag in RICH_TAGS:
            out.append('<br>' if c.tag == 'br' else f'<{c.tag}>{rich(c)}</{c.tag}>')
        elif 'tag' not in c.classes:
            out.append(rich(c))
    return re.sub(r'^(\s|<br>)+|(\s|<br>)+$', '', ''.join(out)).replace('<br> ', '<br>')


def parse(source: str) -> dict:
    tree = Tree()
    tree.feed(source)
    root = tree.root
    header = next(root.find_all(lambda n: n.tag == 'header'))
    title = squash(next(header.find_all(lambda n: n.tag == 'h1')).text())
    notice_box = [n for n in header.children if isinstance(n, Node) and n.tag == 'div' and 'meta' not in n.classes]
    notice = [squash(line) for line in notice_box[0].text().split('\n') if squash(line)] if notice_box else []
    tabs = [squash(b.text()) for b in root.find_all(lambda n: n.tag == 'button' and 'tab-btn' in n.classes)]
    cases = []
    for idx, panel in enumerate(root.find_all(lambda n: 'case-panel' in n.classes), start=1):
        date, _, label = tabs[idx - 1].partition('·')
        article = next(panel.find_all(lambda n: n.tag == 'article'))
        sections, part, discussion_label = [], 'interview', None
        for child in article.children:
            if not isinstance(child, Node):
                continue
            if 'divider' in child.classes:
                part, discussion_label = 'discussion', squash(child.text()).lstrip('▼ ').strip()
                continue
            if 'section' not in child.classes:
                continue
            h2 = next(child.find_all(lambda n: n.tag == 'h2'))
            time_node = next(h2.find_all(lambda n: 'time' in n.classes), None)
            time = squash(time_node.text()) if time_node else ''
            heading = squash(''.join(c if isinstance(c, str) else '' for c in h2.children))
            turns = []
            for t in child.find_all(lambda n: 'turn' in n.classes):
                role = next((ROLE[c] for c in t.classes if c in ROLE), 'note')
                who = squash(next(t.find_all(lambda n: 'who' in n.classes)).text())
                text = squash(next(t.find_all(lambda n: 'text' in n.classes)).text())
                turns.append({'role': role, 'who': who, 'text': text})
            sections.append({'id': f'c{idx}s{len(sections) + 1}', 'title': heading, 'time': time, 'part': part, 'turns': turns})
        aside = next(panel.find_all(lambda n: n.tag == 'aside'))
        legend, groups = [], []
        for child in aside.children:
            if not isinstance(child, Node):
                continue
            if child.tag == 'h3':
                groups.append({'title': squash(child.text()), 'cards': []})
            elif 'legend' in child.classes:
                for row in (r for r in child.children if isinstance(r, Node)):
                    dot = next(row.find_all(lambda n: 'dot' in n.classes), None)
                    style = dot.attrs.get('style', '') if dot else ''
                    role = next((r for k, r in DOT_ROLE.items() if k in style), 'note')
                    legend.append({'role': role, 'text': squash(row.text())})
                if groups and not groups[-1]['cards']:
                    groups.pop()  # the legend's own heading is not a card group
            elif 'card' in child.classes:
                tag = next(child.find_all(lambda n: 'tag' in n.classes), None)
                groups[-1]['cards'].append({'tag': squash(tag.text()) if tag else '', 'quote': 'quote' in child.classes, 'html': rich(child)})
        cases.append({'id': f'case{idx}', 'date': date.strip(), 'label': label.strip(), 'legend': legend,
                      'discussionLabel': discussion_label, 'sections': sections, 'groups': groups})
    return {'title': title, 'notice': notice, 'cases': cases}


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    data = parse(open(sys.argv[1], encoding='utf-8').read())
    with open(sys.argv[2], 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    for c in data['cases']:
        print(c['id'], c['date'], c['label'], len(c['sections']), 'sections', sum(len(s['turns']) for s in c['sections']), 'turns',
              sum(len(g['cards']) for g in c['groups']), 'cards')


if __name__ == '__main__':
    main()

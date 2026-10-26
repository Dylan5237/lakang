import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Rich } from '../src/components/Rich';

describe('分节精读渲染', () => {
  it('小标题、段落、列表和旧卡引用保持语义', () => {
    const html = renderToStaticMarkup(createElement(Rich, { text: '### 问题入口\n一段正文\n- 条目\n\n### 接着读\nK074' }));
    expect(html).toContain('<h3>问题入口</h3>'); expect(html).toContain('<p>一段正文</p>');
    expect(html).toContain('<ul>'); expect(html).toContain('href="#/card/K074"');
    expect(html).not.toContain('### ');
  });
  it('文本仍转义，扩展不开放任意HTML', () => {
    const html = renderToStaticMarkup(createElement(Rich, { text: '### <script>alert(1)</script>\n<img src=x onerror=alert(1)>' }));
    expect(html).not.toContain('<script>'); expect(html).not.toContain('<img'); expect(html).toContain('&lt;script&gt;');
  });
});

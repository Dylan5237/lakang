import { cardById, termById } from './study';

/** 卡片短名：标题冒号前的部分；没有冒号或过长时退到专题名（去掉“专题”后缀）。 */
export function cardName(id: string): string {
  const c = cardById.get(id);
  if (!c) return '';
  const head = c.title.split(/[：:]/)[0];
  return head !== c.title && head.length <= 10 ? head : c.topic.replace(/专题$/, '');
}

/** 针对一张概念卡预备的提问：例子 / 误解 / 关联（或术语辨析） / 下一步；全部由卡片数据生成，不需要额外撰写。 */
export function cardQuestions(id: string): string[] {
  const c = cardById.get(id);
  if (!c) return [];
  const name = cardName(id);
  const out = [`用一个日常的例子讲讲「${name}」`, `「${name}」最容易被误解成什么？`];
  const related = c.relatedCardIds.map(cardName).find((n) => n && n !== name);
  const [t1, t2] = c.termIds.map((t) => termById.get(t)?.zh).filter((z): z is string => !!z);
  if (related) out.push(`它和「${related}」是什么关系？`);
  else if (t1 && t2) out.push(`「${t1}」和「${t2}」有什么区别？`);
  out.push('读完这张卡，下一步该读什么？');
  return out;
}

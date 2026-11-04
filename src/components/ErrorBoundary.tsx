import { Component, type ReactNode } from 'react';

/** Last-resort UI: keep a broken render from leaving a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="crash" role="alert">
      <h1>页面出错了</h1>
      <p className="muted">可能是本地数据损坏或浏览器版本过旧。刷新一般可以恢复；学习进度保存在本机，不会因此上传或删除。</p>
      <button type="button" className="btn primary" onClick={() => location.reload()}>重新载入</button>
    </main>;
  }
}

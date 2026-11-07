import { Component, type ReactNode } from 'react';

/** A missing/lost WebGL context must not take down catalog, pricing, or controls. */
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-unavailable" role="status">
      <strong>The 3D view could not start.</strong>
      <p>Check WebGL2 support. Your furniture list and placement controls still work.</p>
      <button type="button" className="button button-outline" onClick={() => this.setState({ failed: false })}>Retry 3D view</button>
    </div> : this.props.children;
  }
}

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="landing">
          <h1 className="landing-title">Oups</h1>
          <p className="landing-subtitle">Une erreur est survenue. Recharge la page.</p>
        </main>
      );
    }
    return this.props.children;
  }
}

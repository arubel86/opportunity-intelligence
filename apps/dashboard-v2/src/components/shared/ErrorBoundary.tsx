import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>⚠️ Error</h2>
            <p>{this.state.error?.message || 'Algo salió mal'}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Reintentar
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react"
import { useErrorStore } from "./errorStore"
import { toErrorMessage } from "./appError"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: toErrorMessage(error),
    }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    useErrorStore.getState().reportError("render", error, {
      code: "REACT_ERROR_BOUNDARY",
      details: {
        componentStack: errorInfo.componentStack,
        kind: "react.error-boundary",
      },
    })
    console.error("ErrorBoundary caught", error, errorInfo)
  }

  private handleReload = () => {
    useErrorStore.getState().clearErrors()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h2>Something went wrong</h2>
            <p className="error-boundary-message">{this.state.message}</p>
            <div className="error-boundary-actions">
              <button type="button" className="primary-action" onClick={this.handleReload}>
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

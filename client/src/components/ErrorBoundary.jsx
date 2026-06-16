import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-red-500" />
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-neutral-400 mb-6">
              An unexpected runtime error occurred. Please try reloading the application.
            </p>

            {this.state.error && (
              <pre className="text-left bg-neutral-950/60 p-4 rounded-xl border border-neutral-900 text-xs text-neutral-500 font-mono overflow-auto max-h-32 mb-6 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/10 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info for display
    this.setState({ errorInfo });

    // Track error in analytics
    analytics.track(EVENTS.PAGE_LOAD_ERROR, {
      error_message: error?.message || 'Unknown error',
      error_stack: error?.stack?.substring(0, 500),
      component_stack: errorInfo?.componentStack?.substring(0, 500),
      page: window.location.pathname,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h1 className="text-center text-3xl font-bold">
              <span className="text-gradient">Centro de Carreiras</span>
            </h1>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
            <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-gray-900">
                  Algo deu errado
                </h2>
                <p className="mt-4 text-gray-600">
                  Ocorreu um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para resolver.
                </p>

                {/* Error details (only in development) */}
                {import.meta.env.DEV && this.state.error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                    <p className="text-sm font-medium text-red-800">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={this.handleReload}
                    className="inline-flex items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Voltar ao inicio
                  </button>
                </div>

                <p className="mt-6 text-xs text-gray-500">
                  Se o problema persistir, entre em contato com{' '}
                  <a href="mailto:suporte@patronos.org" className="text-patronos-accent hover:underline">
                    suporte@patronos.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

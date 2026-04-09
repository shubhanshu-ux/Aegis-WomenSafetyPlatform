import { Component } from "react";
import { APP_NAME } from "../constants/branding";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`${APP_NAME} error boundary:`, error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const msg =
        this.state.error?.message ||
        "Something went wrong. You can try again or refresh the page.";
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 text-center dark:from-gray-900 dark:to-gray-950">
          <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{APP_NAME}</p>
          <div className="mt-8 max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-soft-lg dark:border-gray-700 dark:bg-gray-800">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">We hit a snag</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-gray-300">{msg}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

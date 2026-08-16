import { Component } from "react";

/**
 * Error Boundary — menangkap error di komponen anak agar seluruh aplikasi
 * tidak crash. Menampilkan pesan error yang ramah pengguna.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error ke console untuk debugging
    console.error("[kci] ErrorBoundary menangkap error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      // Jika custom fallback diberikan, gunakan itu
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      // Default error UI
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-6 py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              Terjadi Kesalahan
            </h2>
            <p className="mb-6 text-sm leading-6 text-slate-600">
              Maaf, sesuatu yang tidak terduga terjadi. Silakan coba lagi.
              Bila masalah ini terus berulang, hubungi kami lewat halaman
              Hubungi Kami.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

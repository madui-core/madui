import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1">
      {/* Hero Section */}
      <div className="container relative flex flex-col items-center justify-center gap-4 px-6 py-24 text-center md:py-32 lg:py-40">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg mb-4">
          <span className="text-4xl font-bold text-white">M</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Build faster with{' '}
          <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MadUI
          </span>
        </h1>
        
        <p className="max-w-2xl leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Beautifully designed components built with Radix UI and Tailwind CSS. 
          Copy, paste, and own your code. No dependencies required.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/docs/components/button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
          >
            View Components
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container border-t py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 dark:text-blue-400"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Copy & Paste</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No npm packages. Just copy the code you need and paste it into your project.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-600 dark:text-purple-400"
              >
                <path d="M20 7h-9" />
                <path d="M14 17H5" />
                <circle cx="17" cy="17" r="3" />
                <circle cx="7" cy="7" r="3" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Fully Customizable</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built with Tailwind CSS. Change colors, sizes, and styles to match your brand.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600 dark:text-green-400"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Accessible</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built with Radix UI. Keyboard navigation and screen reader support included.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-600 dark:text-orange-400"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">TypeScript</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Full TypeScript support with type definitions for all components.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-600 dark:text-slate-400"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Dark Mode</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All components support dark mode by default. Toggle and it just works.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-950 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-pink-600 dark:text-pink-400"
              >
                <path d="M4 3h16" />
                <path d="M4 7h16" />
                <path d="M4 11h16" />
                <path d="M4 15h16" />
                <path d="M4 19h16" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">CLI Tool</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Quickly add components to your project with our powerful CLI tool.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

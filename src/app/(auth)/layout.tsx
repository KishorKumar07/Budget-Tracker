export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Budget Tracker
          </span>
          <p className="text-sm text-muted-foreground">
            Simple, calm money tracking.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

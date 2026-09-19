export default function InviteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

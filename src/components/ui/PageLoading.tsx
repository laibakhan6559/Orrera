/** Full-screen loader used while a page chunk downloads on first visit. */
export function PageLoading() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-void">
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto block size-12 animate-spin rounded-full border-2 border-brass/20 border-t-brass-soft"
        />
        <p className="eyebrow mt-5">Loading</p>
      </div>
    </div>
  );
}

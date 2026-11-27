/**
 * Says "this is a preview" on every page of a pull-request preview, so nobody
 * mistakes it for the real Centro de Carreiras or types real data into it.
 *
 * VITE_PREVIEW is "1" only in builds made by previews/cloudbuild.yaml; the
 * production build never sets it, so this renders nothing there.
 * pointer-events-none keeps it from covering anything it floats over.
 */
export default function PreviewBadge() {
  if (import.meta.env.VITE_PREVIEW !== '1') return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-3 left-1/2 z-[70] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-1.5 text-center text-xs font-medium text-white shadow-lg"
    >
      Prévia com dados fictícios — nada aqui chega ao Centro de Carreiras de verdade
    </div>
  );
}

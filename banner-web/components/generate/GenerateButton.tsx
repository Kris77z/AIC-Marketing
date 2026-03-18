import { LoaderCircle, Rocket } from "lucide-react";

export function GenerateButton({
  loading,
  onClick
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
      {loading ? "生成中..." : "开始生成"}
    </button>
  );
}

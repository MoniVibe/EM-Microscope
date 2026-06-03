import { StopCircle } from "lucide-react";
import type { L3ComputeProgress } from "./computeL3Image";

export function L3ComputeStatus({
  running,
  progress,
  onCancel
}: {
  running: boolean;
  progress: L3ComputeProgress | null;
  onCancel: () => void;
}) {
  if (!running && !progress) return null;

  return (
    <div className="l3-status">
      <div>
        <span>{running ? "Computing" : "Status"}</span>
        <strong>{progress?.message ?? "Idle"}</strong>
      </div>
      <progress value={progress?.percent ?? 0} max={100} />
      {running && (
        <button type="button" title="Cancel L3 compute" onClick={onCancel}>
          <StopCircle size={17} />
          <span>Cancel</span>
        </button>
      )}
    </div>
  );
}

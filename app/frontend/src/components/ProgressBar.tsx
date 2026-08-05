interface Props {
  percentLeft: number;
  empty: boolean;
}

export function ProgressBar({ percentLeft, empty }: Props) {
  return (
    <div className="game-progress-track" role="progressbar" aria-valuenow={Math.round(percentLeft)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`game-progress-fill${empty ? " game-progress-empty" : ""}`}
        style={{ width: `${percentLeft}%` }}
      />
    </div>
  );
}

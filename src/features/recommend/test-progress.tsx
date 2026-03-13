interface TestProgressProps {
  current: number;
  total: number;
}

export default function TestProgress({ current, total }: TestProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        {current} / {total}
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-foreground transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

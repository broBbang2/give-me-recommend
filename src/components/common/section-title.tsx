interface SectionTitleProps {
  title: string;
  description?: string;
}

export default function SectionTitle({
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 h-px w-16 bg-primary/70" />
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
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
      <h2 className="text-2xl font-bold">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
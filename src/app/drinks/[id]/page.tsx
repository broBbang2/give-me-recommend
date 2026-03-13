import { redirect } from "next/navigation";
import PageContainer from "@/components/common/page-container";

interface DrinkDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DrinkDetailPage({
  params
}: DrinkDetailPageProps) {
  await params;
  redirect("/drinks");

  return (
    <PageContainer className="space-y-6">
      <p className="text-muted-foreground">술 둘러보기 페이지로 이동합니다.</p>
    </PageContainer>
  );
}
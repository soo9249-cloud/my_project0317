export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return (
    <div>
      <h1 className="text-[var(--text-primary)]">팀 상세: {teamId}</h1>
    </div>
  );
}

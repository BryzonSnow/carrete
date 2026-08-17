import { EventView } from "@/components/EventView";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventView slug={slug} />;
}

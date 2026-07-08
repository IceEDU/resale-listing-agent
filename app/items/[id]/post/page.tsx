import Link from "next/link";
import { notFound } from "next/navigation";
import PostOptions from "@/components/PostOptions";
import { marketplaceOptions } from "@/lib/connectors";
import { getItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/items/${item.id}`} className="text-sm text-zinc-500">
        ← Back to item
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Where should it go?</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {item.title} · ${item.price}
        </p>
      </div>
      <PostOptions itemId={item.id} options={marketplaceOptions()} />
    </div>
  );
}

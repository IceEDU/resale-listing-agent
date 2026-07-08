import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-semibold tracking-tight text-zinc-700">404</p>
      <div>
        <h1 className="text-xl font-semibold">This page does not exist</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The item may have been deleted, or the link is wrong.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Link href="/" className="btn-primary">
          Back to dashboard
        </Link>
        <Link href="/listings" className="btn-secondary">
          See your listings
        </Link>
      </div>
    </div>
  );
}

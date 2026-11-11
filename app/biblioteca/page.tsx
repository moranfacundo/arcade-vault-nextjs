import { Suspense } from "react";
import { DataFallback } from "@/components/data-fallback";
import { Library } from "@/components/library";
import { listGames } from "@/lib/db/games";

async function LibraryData() {
  const games = await listGames();
  return <Library games={games} />;
}

export default function BibliotecaPage() {
  return (
    <Suspense fallback={<DataFallback />}>
      <LibraryData />
    </Suspense>
  );
}

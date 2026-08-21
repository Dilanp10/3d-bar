export default function Loading() {
  return (
    <main className="min-h-dvh flex flex-col" aria-busy="true">
      <div className="w-full aspect-square sm:aspect-[4/3] skeleton" />
      <div className="flex-1 px-5 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full space-y-4">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton h-7 w-32" />
        <div className="pt-6 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-9/12" />
        </div>
      </div>
    </main>
  );
}

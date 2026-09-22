export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Magazyn
      </p>
      <h1 className="mt-4 max-w-xl text-center text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
        Warehouse WMS
      </h1>
      <p className="mt-4 max-w-md text-center text-lg leading-relaxed text-zinc-600">
        Lekki system magazynowy: spis z natury, stany z ruchów i skan na hali.
        Fundament aplikacji — bez logowania na tym etapie.
      </p>
    </main>
  );
}

import AppList from '../components/Applist';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Laconic Applications</h1>
      <AppList />
    </main>
  );
}
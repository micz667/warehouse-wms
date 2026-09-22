import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Magazyn
      </p>
      <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-900">
        Logowanie
      </h1>
      <p className="mt-2 max-w-sm text-center text-zinc-600">
        Zaloguj się kontem magazyniera, architekta lub administratora.
      </p>
      <LoginForm />
    </main>
  );
}

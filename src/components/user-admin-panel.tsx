"use client";

import type { Role } from "@prisma/client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ROLE_LABEL_PL } from "@/lib/role-labels";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
};

const ROLE_OPTIONS: Role[] = ["magazynier", "architekt", "admin"];

export function UserAdminPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("magazynier");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/users");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać użytkowników");
        return;
      }
      const data = (await res.json()) as { users: UserRow[] };
      setUsers(data.users);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || null,
          role,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        user?: UserRow;
        error?: string;
      } | null;
      if (!res.ok || !body?.user) {
        setCreateError(body?.error ?? "Nie udało się utworzyć użytkownika");
        return;
      }
      setEmail("");
      setPassword("");
      setName("");
      setRole("magazynier");
      load();
    } finally {
      setCreating(false);
    }
  }

  async function onRoleChange(userId: string, nextRole: Role) {
    setError(null);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!res.ok) {
      setError(body?.error ?? "Nie udało się zmienić roli");
      return;
    }
    load();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Użytkownicy
        </h1>
        <p className="mt-1 text-zinc-600">
          Tworzenie kont i zmiana ról (magazynier, architekt, admin).
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="mt-8 space-y-4 border-b border-zinc-200 pb-8"
        data-testid="user-create-form"
      >
        <h2 className="text-lg font-medium text-zinc-900">Nowy użytkownik</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block" htmlFor="user-email">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </span>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block" htmlFor="user-password">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Hasło
            </span>
            <input
              id="user-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </label>
          <label className="block" htmlFor="user-name">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Imię / nazwa
            </span>
            <input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block" htmlFor="user-role">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Rola
            </span>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL_PL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {createError ? (
          <p className="text-sm text-red-700" role="alert">
            {createError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {creating ? "Tworzenie…" : "Utwórz użytkownika"}
        </button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-zinc-200 border-t border-zinc-200">
        {users.length === 0 && !pending ? (
          <li className="py-8 text-center text-sm text-zinc-500">
            Brak użytkowników.
          </li>
        ) : null}
        {users.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            data-testid="user-row"
          >
            <div>
              <p className="font-medium text-zinc-900">
                {user.name?.trim() || user.email}
              </p>
              <p className="text-sm text-zinc-600">{user.email}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <span className="sr-only">Rola</span>
              <select
                aria-label={`Rola dla ${user.email}`}
                value={user.role}
                onChange={(e) =>
                  onRoleChange(user.id, e.target.value as Role)
                }
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm"
                data-testid="user-role-select"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL_PL[r]}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

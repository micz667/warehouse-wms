# warehouse-wms

Lekki WMS (PWA na Android): spis z natury → stany z ruchów → skan przyjęć/przesunięć/wydań → listy zakupów dla architektów.

Dokumenty handlowe: Symfonia Handel (eksport ruchów później). Kartoteka jest trwała między spisami.

## Wymagania

- Node.js 22+
- Docker (lokalny Postgres) albo inna baza Postgres
- npm

## Instalacja

```bash
git clone <repo>
cd warehouse-wms
cp .env.example .env
npm install
```

## Środowisko

Skopiuj `.env.example` do `.env`. Domyślny connection string:

```
DATABASE_URL="postgresql://warehouse:warehouse@localhost:5432/warehouse?schema=public"
```

## Postgres (Docker)

```bash
docker compose up -d
npx prisma migrate deploy
npx prisma generate
```

## Development

```bash
npm run dev
```

Aplikacja: [http://localhost:3000](http://localhost:3000) — polska strona-placeholder magazynu (bez auth).

## Sprawdzenie (check)

```bash
npm run check
```

Uruchamia lint (ESLint), `tsc --noEmit` oraz `prisma validate`.

## Spec (Limen)

- Vision: [`spec/vision.md`](spec/vision.md)
- Board: [`spec/build.md`](spec/build.md)
- Tickets: `spec/features/`

## Stack (MVP)

Next.js App Router · Postgres · Prisma · Auth.js · Tailwind · PWA (kamera)

Auth, katalog, stany i Symfonia — kolejne slice'y; stan magazynowy nigdy nie jest kolumną zapisywaną ad hoc.

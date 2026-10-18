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

Uzupełnij w `.env` wartość `AUTH_SECRET` (np. `openssl rand -base64 33`).

## Środowisko

Skopiuj `.env.example` do `.env`. Kluczowe placeholdery:

```
DATABASE_URL="postgresql://warehouse:warehouse@localhost:5432/warehouse?schema=public"
AUTH_SECRET="replace-with-a-long-random-string"
SEED_ADMIN_EMAIL="admin@local"
SEED_ADMIN_PASSWORD="change-me"
```

Hasła z przykładu to wyłącznie placeholdery lokalne — nigdy nie używaj ich w środowisku współdzielonym.

Seed tworzy administratora tylko gdy go brakuje i **nie nadpisuje** istniejącego hasła. Aby świadomie zresetować hasło admina przy seedzie, ustaw `SEED_ADMIN_RESET=1` (albo `true`) w `.env`.

## Postgres (Docker)

`docker-compose.yml` publikuje Postgres na hoście pod portem **5432** (kontener `5432:5432`).

```bash
docker compose up -d
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Seed tworzy lokalnego administratora (`admin@local` / `change-me` domyślnie) tylko przy pierwszym uruchomieniu dla tego emaila.

## Development

```bash
npm run dev
```

Aplikacja: [http://localhost:3000](http://localhost:3000) — bez sesji przekieruje na logowanie (PL).

## Sprawdzenie (check)

```bash
npm run check
```

Uruchamia lint (ESLint), `tsc --noEmit`, `prisma validate`, oraz łańcuch dowodów (`prove:*` / `prove:*-db`), w tym F019: `prove:hardening`, `prove:stock-concurrency-db`, `prove:cafe-double-post-db`, `prove:opening-stocktake-once-db`. Skrypty `*-db` wymagają działającego Postgresa pod `DATABASE_URL` (domyślnie `localhost:5432`).

Przy uruchomionym serwerze (`npm run build && npm start`) możesz też:

```bash
npm run prove:auth-http
npm run prove:catalog-http
npm run prove:locations-http
```

— auth sample: 401 / 403 / 200; katalog: persist+szukanie, unikalny kod, 401/403/201, strona etykiety; lokalizacje: unikalny kod, 401/403/201, by-code, stub picker, etykieta.

### Katalog (F003)

- UI: `/katalog`, `/katalog/nowy`, `/katalog/[id]`, `/katalog/[id]/etykieta`
- Symbologia etykiet: **Code128** (JsBarcode `CODE128`), wartość `WMS` + 12 hex
- Zdjęcia opcjonalne: lokalnie w `storage/catalog/`, serwowane przez `/uploads/catalog/[filename]` **tylko dla zalogowanych** (ścieżka w `CatalogItem.photoPath`); treść pliku sprawdzana po magic bytes, nie po MIME przeglądarki
- Zapis (create/edit/photo): role `magazynier` i `admin`; odczyt także dla `architekt`
- Seam dla F005: `createCatalogItem` w `src/server/catalog/create-catalog-item.ts`

### Lokalizacje (F004)

- UI: `/lokalizacje`, `/lokalizacje/nowa`, `/lokalizacje/[id]`, `/lokalizacje/[id]/etykieta`, stub picker `/lokalizacje/wybierz`
- Model: unikalny `code` + `label`; kod to wartość etykiety Code128
- Zapis: tylko `admin`; odczyt / wybór: `magazynier`, `architekt`, `admin`
- Seam dla F007: komponent `LocationPicker` + `findLocationByCode` / `GET /api/locations/by-code/[code]`

## Spec (Limen)

- Vision: [`spec/vision.md`](spec/vision.md)
- Board: [`spec/build.md`](spec/build.md)
- Tickets: `spec/features/`

## Stack (MVP)

Next.js App Router · Postgres · Prisma · Auth.js · Tailwind · PWA (kamera)

Stan magazynowy nigdy nie jest kolumną zapisywaną ad hoc — zawsze suma ruchów (`Movement`).

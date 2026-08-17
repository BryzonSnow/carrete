# Carrete — beta 0.1

App para armar un carrete: quién va, quién lleva el hielo, y la cuota. Un link. Sin login.

| Capa | Stack |
| --- | --- |
| Frontend | Next.js (React) en Vercel |
| Backend | Python (FastAPI) en Railway o Render |
| DB + live | Supabase (PostgreSQL + Realtime) |

## Flujo

1. **Host** crea el evento (nombre, fecha, dirección opcional, datos de transferencia, insumos).
2. Sale un link de invitados `/e/asado-sabado-x8y9z` y un **link mágico de admin** `/a/{token}` (también queda en `localStorage`).
3. **Invitado** abre el link, pone su apodo (cookie + `localStorage`). RSVP: Voy / No voy / Llego más tarde.
4. La dirección y los datos bancarios se muestran solo si confirmó asistencia.
5. **Yo llevo**: tap para asignarse un ítem (`1/2 bolsas · Nico`). `+ Agregar` para aportes libres.
6. Si hay cuota: barra recaudado vs meta, **Copiar datos de transferencia**, checkbox **Ya transferí**. El host valida con check verde.

La lista se actualiza en vivo: el backend escribe en Postgres, un trigger pega `live_signals`, el frontend escucha Realtime y vuelve a pedir el API (así no se filtran dirección ni banco por RLS).

## Setup local

### 1. Postgres local (Docker)

```bash
docker compose up -d
```

Queda en `localhost:5433`. Supabase se conecta después; en local el front hace polling cada 4s.

### 2. Backend (Python 3.12+)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate          # mac/linux: source .venv/bin/activate
copy .env.example .env            # o cp en mac/linux
# DATABASE_URL local ya viene en .env.example
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

API en `http://localhost:8080` (`GET /health`). Tests: `pytest`.

### 3. Frontend

```bash
cd frontend
copy .env.example .env.local
# con solo NEXT_PUBLIC_API_URL=http://localhost:8080 alcanza para local
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Deploy

**Frontend — Vercel**

- Root directory: `frontend`
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Backend — Railway**

- Root directory: `backend`
- Env: `DATABASE_URL`, `CORS_ORIGIN=https://tu-app.vercel.app`, `PORT` lo asigna Railway

**Backend — Render**

- Blueprint: `render.yaml`, o Web Service con Dockerfile en `backend/`
- Mismas env vars. Agrega el origen de Vercel a `CORS_ORIGIN` (separa con comas si hay varios).

En Supabase → Authentication no hace falta para la beta: los invitados son anónimos por token.

## API

| Método | Ruta | Auth |
| --- | --- | --- |
| `POST` | `/api/events` | — |
| `GET` | `/api/events/{slug}` | `X-Guest-Token`, `X-Admin-Token` |
| `GET` | `/api/admin/{token}` | link mágico |
| `POST` | `/api/events/{slug}/join` | guest opcional (reusa sesión) |
| `PUT` | `/api/events/{slug}/rsvp` | guest |
| `POST` | `/api/events/{slug}/items` | guest o admin |
| `PUT` | `/api/events/{slug}/items/{id}/claim` | guest |
| `POST` | `/api/events/{slug}/transfer` | guest |
| `POST` | `/api/events/{slug}/payments/{guestId}/validate` | admin |

## Notas

- La cuota se guarda en pesos chilenos (entero). Meta = cuota × (Voy + Llego más tarde).
- Recaudado = pagos **validados** por el host.
- Si no configuras las keys de Supabase en el frontend, la UI hace polling cada 4s.

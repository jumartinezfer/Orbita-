# Orbita · Servicio de saldo.

Prueba técnica Developer Full Stack para Vyrtium. API de saldo prepago (Node.js + TypeScript +
Express) y pantalla web (React + Vite) que la consume.

## Stack y por qué.

- **Backend:** Express + TypeScript, sin framework pesado — para 6 endpoints no se justifica el
  costo de setup de NestJS en una prueba de 5 horas.
- **Persistencia:** SQLite con `better-sqlite3`, en un archivo local (`backend/data/orbita.db`).
  Es síncrono (sin callbacks/promesas), corre embebido sin Docker ni servicios externos, y las
  operaciones de saldo (leer, validar, escribir, insertar transacción) se ejecutan dentro de una
  única transacción SQLite — justo lo que se necesita para que depósitos/retiros e
  idempotencia sean atómicos. Los tests usan `:memory:` para no tocar disco.
- **Montos en centavos:** todo monto se valida como texto (`"150.25"`) y se convierte a enteros
  (centavos) antes de tocar la base de datos. Evita el clásico problema de floats de JS con
  dinero (`0.1 + 0.2 !== 0.3`).
- **Auth:** JWT (HS256), expiración de 30 minutos. Elegí JWT sobre un token opaco porque no hay
  necesidad de revocación inmediata ni de refresh tokens en el alcance de la prueba, y evita una
  tabla de sesiones extra. 30 minutos es un balance razonable entre seguridad y no obligar a
  loguearse todo el tiempo para una demo corta; en producción lo acompañaría de un refresh token.
- **Contraseñas:** hash con `scrypt` (nativo de Node, sin dependencias externas ni binarios
  nativos adicionales a los que ya trae `better-sqlite3`).
- **Frontend:** Vite + React, sin router (solo dos pantallas, alternadas por estado de sesión) ni
  librería de estado (el estado es local a cada pantalla, no hay necesidad de Redux/Zustand aquí).

## Cómo correr el proyecto.

Requisitos: Node 20+.

```bash
npm install
```

### API.

```bash
cp backend/.env.example backend/.env   # opcional, los defaults ya funcionan en local
npm run dev:api
```

Queda en `http://localhost:4000`. Al arrancar por primera vez crea `backend/data/orbita.db` y
siembra los usuarios de prueba.

### Web.

```bash
npm run dev:web
```

Queda en `http://localhost:5173` y apunta a `http://localhost:4000` (configurable con
`VITE_API_URL`).

### Tests.

```bash
npm run test:api
npm run test:web
```

## Usuarios de prueba.

| id      | email              | password     |
|---------|--------------------|--------------|
| `u_123` | ana@orbita.test    | `Orbita123!` |
| `u_456` | bruno@orbita.test  | `Orbita123!` |

`u_123` es el usuario usado en el ejemplo del webhook del enunciado.

## Decisiones y supuestos.

- **Idempotencia:** la llave se guarda por `(key, user_id, endpoint)`. Si llega una llave repetida,
  se devuelve la respuesta guardada sin volver a tocar el saldo. Si la operación original falló
  (por ejemplo saldo insuficiente), no se guarda nada, así un reintento con la misma llave puede
  prosperar si las condiciones cambiaron.
- **Webhook:** se verifica la firma HMAC-SHA256 sobre el *raw body* (antes de parsear JSON), con
  `timingSafeEqual` para evitar timing attacks. La deduplicación es por `event_id` en una tabla
  aparte — si el evento ya se procesó, se responde 200 sin reaplicar el movimiento. Un pago
  `rejected` se registra como visto pero no acredita saldo.
- **Errores:** formato consistente `{ "error": { "code": "...", "message": "..." } }`, con códigos
  HTTP semánticos (400 validación, 401 auth, 422 saldo insuficiente, 404, 500).
- **Paginación:** offset/limit simple (`?limit=&offset=`), por ser predecible y suficiente para
  una lista de movimientos de un solo usuario; no hay necesidad de cursor-based pagination a esta
  escala.
- **Frontend / manejo de 401:** la capa de API tiene un hook global (`setSessionExpiredHandler`)
  que el `AuthContext` registra; si cualquier request responde 401, se limpia la sesión y se
  muestra el motivo en la pantalla de login. Así no hay que repetir ese manejo en cada pantalla.

## Qué dejé fuera.

- **Rate limiting / bloqueo de intentos en login** — mencionado como opcional, no alcanzó el
  tiempo.
- **Docker Compose** — no hacía falta para SQLite embebido, pero lo agregaría para dejar todo
  reproducible con un solo comando si el proyecto creciera.
- **Refresh tokens** — hoy si el token expira, el usuario simplemente vuelve a loguearse. Con más
  tiempo agregaría un refresh token de vida más larga.
- **Test end-to-end del flujo de "token vencido" en el frontend** — la lógica está implementada y
  es la misma ruta que ya cubren los tests del backend (401 por token inválido), pero no alcancé a
  escribir un test de integración específico en React que simule la expiración a mitad de sesión.
- **Logs estructurados** — hoy solo hay un `console.error` para errores 500.
- **Deploy continuo** — no lo configuré por tiempo; lo primero que haría es un workflow de GitHub
  Actions que corra ambos test suites en cada push.

## Tiempo dedicado

Aproximadamente 5 horas, siguiendo el plan: diseño y setup (~20 min), API completa con
idempotencia y webhook (~2h), frontend completo (~1h40), tests de ambos lados (~45 min), pruebas
manuales end-to-end en navegador y README (~25 min).

## Dónde usé IA

Usé ChatGPT y Gemini como asistente durante toda la implementación: para generar el andamiaje inicial
de ambos proyectos, escribir la mayoría del código de endpoints/componentes a partir de mis
decisiones de diseño, y correr las pruebas automatizadas y manuales. Las decisiones de arquitectura (SQLite + centavos enteros, JWT vs. opaco, cómo estructurar la idempotencia, manejo global de 401) las definí yo; la IA ejecutó y verificó la implementación.

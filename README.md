## Prueba Tecnica API (NestJS + Supabase + AWS Lambda)

Backend serverless para la prueba técnica. Expone endpoints REST para productos, clientes, transacciones y entregas; persiste en Supabase (PostgreSQL) y se despliega en AWS Lambda a través de API Gateway.

### Decisiones técnicas
- **Framework**: NestJS (TypeScript) por su modularidad, inyección de dependencias y DX.
- **Arquitectura**: módulos por dominio (`products`, `transactions`, `customers`, `deliveries`) con separación `presentation` (controllers) y `services` (casos de uso). Integración a datos por puerto/adapter via `SupabaseModule`.
- **Persistencia**: Supabase (`@supabase/supabase-js`) inyectado como `SUPABASE` a través de un provider global. Variables de entorno: `API_URL_SUPABASE` y `ANON_API_KEY`.
- **Ejecución serverless**: `serverless-http` para adaptar la app Express de Nest a Lambda. Entrada `lambdaHandler` en `src/lambda.ts`.
- **Seguridad**: 
  - `ApiKeyGuard` que exige header `x-api-key`/`api-key` a todos los endpoints (salvo los marcados con `@Public()`).
  - Validación con `class-validator` y `ValidationPipe` global (whitelist, transform, forbidNonWhitelisted).
- **Documentación**: Swagger en `/docs` (configurado en bootstrap).
- **CORS**: habilitado para API Gateway y para desarrollo local (origins `http://localhost:3000/3001`).
- **CI/CD**: GitHub Actions despliega con Serverless Framework a AWS Lambda al hacer push a `develop`.
- **Testing**: Jest (+ Supertest para e2e). Cobertura sobre `src/**`. 

### Estructura de carpetas (backend)
```text
api/
├── serverless.yml
├── package.json
├── src/
│  ├── lambda.ts                      # Bootstrap para Lambda y servidor local
│  ├── common/
│  │  ├── decorators/public.decorator.ts
│  │  └── guards/api-key.guard.ts
│  ├── modules/
│  │  ├── app.module.ts               # Módulo raíz
│  │  ├── common/supabase.module.ts   # Provider global SUPABASE
│  │  ├── products/products.module.ts
│  │  ├── transactions/transactions.module.ts
│  │  ├── customers/customers.module.ts
│  │  └── deliveries/deliveries.module.ts
│  ├── presentation/                  # Capa HTTP (controllers)
│  │  ├── health.controller.ts
│  │  ├── products.controller.ts
│  │  ├── transactions.controller.ts
│  │  ├── customers.controller.ts
│  │  └── deliveries.controller.ts
│  ├── services/                      # Casos de uso / reglas de negocio
│  │  ├── products.service.ts
│  │  ├── transactions.service.ts
│  │  ├── customers.service.ts
│  │  └── deliveries.service.ts
│  └── test-utils/supabase.mock.ts
└── postman/wompi-api.postman_collection.json
```

### Endpoints principales
- **GET `/health`**: público. Estado básico del servicio.
- **Products**
  - GET `/products` → Lista productos con `stock > 0`.
- **Customers**
  - POST `/customers` → Crea cliente.
  - GET `/customers/:id` → Obtiene cliente.
- **Transactions**
  - POST `/transactions` → Crea transacción `PENDING` y fija `amount` según precio del producto.
  - PATCH `/transactions/:id` → Actualiza estado (`PENDING` | `COMPLETED` | `FAILED`), guarda `wompi_transaction_id` y, si se completa, decrementa stock del producto.
  - GET `/transactions/:id` → Obtiene transacción.
  - GET `/transactions?customerId=...` → Lista por cliente (o todas).
- **Deliveries**
  - POST `/deliveries` → Crea entrega con estado `CREATED`.
  - GET `/deliveries/:id` → Obtiene entrega.

Todos los endpoints (salvo `/health`) requieren header `x-api-key` válido.

### Modelo relacional (Supabase / PostgreSQL)
Relaciones:
- `transactions.product_id` → FK a `products.id`
- `transactions.customer_id` → FK a `customers.id`
- `deliveries.product_id` → FK a `products.id`
- `deliveries.customer_id` → FK a `customers.id`

Tablas y columnas principales:
- `products(id uuid pk, name varchar, description text, price int, stock int, image varchar, created_at timestamptz, updated_at timestamptz, deleted_at timestamptz)`
- `customers(id uuid pk, name varchar, email varchar, address text, phone varchar, created_at timestamptz, updated_at timestamptz, deleted_at timestamptz)`
- `transactions(id uuid pk, product_id uuid fk, customer_id uuid fk, status varchar, wompi_transaction_id varchar, amount int, created_at timestamptz, updated_at timestamptz, deleted_at timestamptz)`
- `deliveries(id uuid pk, customer_id uuid fk, product_id uuid fk, status varchar, created_at timestamptz, updated_at timestamptz, deleted_at timestamptz)`

Ejemplo de DDL (puedes ejecutar en Supabase):
```sql
create extension if not exists "uuid-ossp";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  description text,
  price int not null,
  stock int not null,
  image varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  email varchar not null,
  address text,
  phone varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  customer_id uuid references customers(id),
  status varchar not null,
  wompi_transaction_id varchar,
  amount int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  product_id uuid references products(id),
  status varchar not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

### Infraestructura en AWS (Serverless Framework)
- **Runtime**: Node.js 20, región `us-west-2`.
- **API Gateway (HTTP API)** con CORS habilitado expone todos los endpoints (`events: httpApi: "*"`).
- **Lambda**: handler `dist/lambda.lambdaHandler` generado desde `src/lambda.ts`.
- **Variables de entorno** (configurables como secrets del proveedor CI/CD o variables en el stage):
  - `API_URL_SUPABASE` y `ANON_API_KEY` (conexión Supabase).
  - `API_KEY` (API Key para `ApiKeyGuard`).
- **Empaquetado**: exclusiones de dev/test para reducir tamaño.
- **CI/CD**: Workflow `.github/workflows/api_develop.yml` construye y ejecuta `sls deploy` al hacer push a `develop` usando credenciales de AWS.

Fragmento relevante de `serverless.yml`:
```yaml
provider:
  name: aws
  runtime: nodejs20.x
  region: us-west-2
  httpApi:
    cors: true

functions:
  api:
    handler: dist/lambda.lambdaHandler
    events:
      - httpApi: "*"
```

### Puesta en marcha
1. Requisitos: Node.js 20 y npm. Se recomienda usar `nvm` para gestionar la versión de Node.
2. Variables de entorno (local):
   - `API_URL_SUPABASE` y `ANON_API_KEY`
   - `API_KEY`
3. Instalar dependencias y correr en local:
```bash
npm ci
npm run start:dev  # http://localhost:9000 y Swagger en /docs
```

Opcionalmente puedes usar Serverless Offline:
```bash
npm run build
npx serverless offline
```

### Despliegue manual
```bash
npm run build
npx serverless deploy
```

### Colección de Postman
`postman/wompi-api.postman_collection.json`

### Notas
- Los pagos reales de Wompi deben usarse en modo Sandbox para pruebas. El flujo de captura/confirmación puede integrarse en el frontend y luego actualizar el estado vía `PATCH /transactions/:id`.
- El stock se decrementa automáticamente cuando una transacción cambia a `COMPLETED`.



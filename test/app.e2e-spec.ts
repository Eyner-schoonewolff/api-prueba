import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';
import { SUPABASE } from '../src/modules/common/supabase.module';
import { SupabaseClientMock } from '../src/test-utils/supabase.mock';

describe('API E2E', () => {
  let app: INestApplication;
  let db: SupabaseClientMock;

  beforeAll(async () => {
    db = new SupabaseClientMock();
    db.setTable('products', [
      { id: 'p1', name: 'Prod 1', description: 'desc', price: 2475148, stock: 10, image: '' },
      { id: 'p2', name: 'Prod 2', description: 'desc', price: 1000, stock: 0, image: '' },
    ]);
    db.setTable('transactions', []);
    db.setTable('customers', []);
    db.setTable('deliveries', []);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SUPABASE)
      .useValue(db)
      .overrideProvider(APP_GUARD)
      .useValue(new ApiKeyGuard({ get: () => 'test-api-key' } as any, { get: () => undefined } as any))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health (public)', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
  });

  it('GET /products requiere x-api-key', async () => {
    const res = await request(app.getHttpServer()).get('/products');
    expect(res.status).toBe(401);
  });

  it('GET /products devuelve solo con stock', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .set('x-api-key', 'test-api-key');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('p1');
  });

  it('POST /customers crea cliente', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set('x-api-key', 'test-api-key')
      .send({ name: 'Juan', email: 'juan@example.com' });
    expect(res.status).toBe(201);
  });

  it('POST /customers valida DTO (400 si falta name o email inválido)', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/customers')
      .set('x-api-key', 'test-api-key')
      .send({ email: 'juan@example.com' });
    expect(res1.status).toBe(400);

    const res2 = await request(app.getHttpServer())
      .post('/customers')
      .set('x-api-key', 'test-api-key')
      .send({ name: 'Juan', email: 'no-es-email' });
    expect(res2.status).toBe(400);
  });

  it('POST /transactions crea transacción y usa precio del producto', async () => {
    const res = await request(app.getHttpServer())
      .post('/transactions')
      .set('x-api-key', 'test-api-key')
      .send({ productId: 'p1', customerName: 'Ana', customerEmail: 'ana@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(2475148);
  });

  it('POST /transactions valida DTO (400 por payload inválido)', async () => {
    // Falta productId
    const res1 = await request(app.getHttpServer())
      .post('/transactions')
      .set('x-api-key', 'test-api-key')
      .send({ customerName: 'Ana', customerEmail: 'ana@example.com' });
    expect(res1.status).toBe(400);

    // Email inválido
    const res2 = await request(app.getHttpServer())
      .post('/transactions')
      .set('x-api-key', 'test-api-key')
      .send({ productId: 'p1', customerName: 'Ana', customerEmail: 'no-email' });
    expect(res2.status).toBe(400);
  });

  it('PATCH /transactions/:id actualiza estado y reduce stock si COMPLETED', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/transactions')
      .set('x-api-key', 'test-api-key')
      .send({ productId: 'p1', customerName: 'Ana', customerEmail: 'ana@example.com' });

    const txId = createRes.body.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/transactions/${txId}`)
      .set('x-api-key', 'test-api-key')
      .send({ status: 'COMPLETED' });

    expect(patchRes.status).toBe(200);

    // check stock reduced to 9
    const listRes = await request(app.getHttpServer())
      .get('/products')
      .set('x-api-key', 'test-api-key');

    expect(listRes.body.find((p: any) => p.id === 'p1').stock).toBe(9);
  });

  it('PATCH /transactions/:id valida DTO (400 si status inválido)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/transactions')
      .set('x-api-key', 'test-api-key')
      .send({ productId: 'p1', customerName: 'Ana', customerEmail: 'ana@example.com' });

    const txId = createRes.body.id;

    const res = await request(app.getHttpServer())
      .patch(`/transactions/${txId}`)
      .set('x-api-key', 'test-api-key')
      .send({ status: 'OTHER' });

    expect(res.status).toBe(400);
  });

  it('POST /deliveries requiere x-api-key', async () => {
    const res = await request(app.getHttpServer()).post('/deliveries').send({ customerId: 'c1', productId: 'p1' });
    expect(res.status).toBe(401);
  });

  it('POST /deliveries crea y GET /deliveries/:id retorna el delivery', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/deliveries')
      .set('x-api-key', 'test-api-key')
      .send({ customerId: 'c1', productId: 'p1' });
    expect(createRes.status).toBe(201);

    const deliveryId = createRes.body.id;

    const getRes = await request(app.getHttpServer())
      .get(`/deliveries/${deliveryId}`)
      .set('x-api-key', 'test-api-key');
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(deliveryId);
  });

  it('POST /deliveries valida DTO (400 si faltan campos)', async () => {
    const res = await request(app.getHttpServer())
      .post('/deliveries')
      .set('x-api-key', 'test-api-key')
      .send({ customerId: 'c1' });
    expect(res.status).toBe(400);
  });
});
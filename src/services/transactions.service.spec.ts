import { Test } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { SUPABASE } from '../modules/common/supabase.module';
import { SupabaseClientMock } from '../test-utils/supabase.mock';

// Simple uuid mock for predictability
jest.mock('uuid', () => ({ v4: () => 'uuid-1' }));

describe('TransactionsService', () => {
  let service: TransactionsService;
  let db: SupabaseClientMock;

  beforeEach(async () => {
    db = new SupabaseClientMock();
    db.setTable('products', [ { id: 'p1', price: 2475148, stock: 5 } ]);
    db.setTable('transactions', []);

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: SUPABASE, useValue: db },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
  });

  it('crea transacción tomando el precio del producto', async () => {
    const tx = await service.create({ productId: 'p1', customerName: 'Ana', customerEmail: 'ana@example.com' });
    expect(tx).toBeDefined();
    expect(tx.amount).toBe(2475148);
  });
});
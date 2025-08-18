import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { SUPABASE } from '../modules/common/supabase.module';
import { SupabaseClientMock } from '../test-utils/supabase.mock';

describe('ProductsService', () => {
  let service: ProductsService;
  let db: SupabaseClientMock;

  beforeEach(async () => {
    db = new SupabaseClientMock();
    db.setTable('products', [
      { id: '1', name: 'Prod A', description: 'A', price: 1000, stock: 10, image: '' },
      { id: '2', name: 'Prod B', description: 'B', price: 2000, stock: 0, image: '' },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: SUPABASE, useValue: db },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('debe listar solo productos con stock > 0', async () => {
    const res = await service.list();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');
  });
});
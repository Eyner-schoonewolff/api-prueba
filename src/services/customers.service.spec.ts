import { Test } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { SUPABASE } from '../modules/common/supabase.module';
import { SupabaseClientMock } from '../test-utils/supabase.mock';

describe('CustomersService', () => {
  let service: CustomersService;
  let db: SupabaseClientMock;

  beforeEach(async () => {
    db = new SupabaseClientMock();
    db.setTable('customers', []);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: SUPABASE, useValue: db },
      ],
    }).compile();

    service = moduleRef.get(CustomersService);
  });

  it('debe crear un cliente', async () => {
    const created = await service.create({ name: 'Juan', email: 'juan@example.com' });
    expect(created).toBeDefined();
  });
});
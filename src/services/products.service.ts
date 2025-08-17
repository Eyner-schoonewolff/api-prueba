import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE } from '../modules/common/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ProductsService {
  constructor(@Inject(SUPABASE) private readonly db: SupabaseClient) {}

  async list() {
    const { data, error } = await this.db
      .from('products')
      .select('id,name,description,price,stock,image')
      .gt('stock', 0);
    if (error) throw error;
    return data ?? [];
  }
}
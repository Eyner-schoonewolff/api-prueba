import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE } from '../modules/common/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DeliveriesService {
  constructor(@Inject(SUPABASE) private readonly db: SupabaseClient) {}

  async create(body: { customerId: string; productId: string }) {
    const { data, error } = await this.db.from('deliveries').insert({ customer_id: body.customerId, product_id: body.productId, status: 'CREATED' }).select().single();
    if (error) throw error;
    return data;
  }

  async get(id: string) {
    const { data, error } = await this.db.from('deliveries').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
}
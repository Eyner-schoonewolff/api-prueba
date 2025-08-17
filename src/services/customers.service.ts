import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE } from '../modules/common/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
  constructor(@Inject(SUPABASE) private readonly db: SupabaseClient) {}

  async create(body: { name: string; email: string; address?: string; phone?: string }) {
    const { data, error } = await this.db.from('customers').insert(body).select().single();
    if (error) throw error;
    return data;
  }

  async get(id: string) {
    const { data, error } = await this.db.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
}
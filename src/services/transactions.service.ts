import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE } from '../modules/common/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(@Inject(SUPABASE) private readonly db: SupabaseClient) {}

  async create(input: { productId: string; customerName: string; customerEmail: string; customerId?: string }) {
    const id = uuid();
    
    // Si no se proporciona customerId, usar el ID por defecto para pruebas
    const finalCustomerId = input.customerId || '8690975e-02f5-42cc-9df1-b3f66febb094';

    // Obtener precio actual del producto para fijar el monto de la transacción
    const { data: prod, error: prodErr } = await this.db
      .from('products')
      .select('price')
      .eq('id', input.productId)
      .single();
    if (prodErr || !prod) throw prodErr ?? new Error('Producto no encontrado');

    const amount = (prod.price as number) ?? 0;
    
    const { data, error } = await this.db
      .from('transactions')
      .insert({ 
        id, 
        product_id: input.productId, 
        customer_id: finalCustomerId,
        amount,
        status: 'PENDING' 
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, body: { status: 'PENDING' | 'COMPLETED' | 'FAILED'; wompiTransactionId?: string }) {
    const { data: updatedTx, error } = await this.db
      .from('transactions')
      .update({ status: body.status, wompi_transaction_id: body.wompiTransactionId ?? null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    if (updatedTx && body.status === 'COMPLETED') {
      // Obtener el producto asociado para decrementar el stock en 1
      const productId = updatedTx.product_id as string | undefined;
      if (productId) {
        // Leer stock actual
        const { data: product, error: productErr } = await this.db
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();
        if (!productErr && product) {
          const newStock = Math.max(0, (product.stock as number) - 1);
          await this.db.from('products').update({ stock: newStock }).eq('id', productId);
        }
      }
    }

    return updatedTx;
  }

  async get(id: string) {
    const { data, error } = await this.db
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async list(customerId?: string) {
    let query = this.db
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
}
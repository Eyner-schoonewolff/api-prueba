import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE = Symbol('SUPABASE');

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.get<string>('API_URL_SUPABASE');
        const key = config.get<string>('ANON_API_KEY');
        if (!url || !key) throw new Error('Missing Supabase env vars');
        return createClient(url, key);
      },
    },
  ],
  exports: [SUPABASE],
})
export class SupabaseModule {}
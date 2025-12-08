import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Mantendo a exportação 'supabase' para compatibilidade com código existente,
// mas agora usando a nova função.
// Nota: O ideal seria refatorar para usar createClient() diretamente nos componentes.
export const supabase = createClient();


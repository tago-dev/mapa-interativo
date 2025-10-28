import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Cliente para componentes client-side que sincroniza sessão via cookies,
// compatível com o middleware e rotas protegidas
export const supabase = createClientComponentClient();

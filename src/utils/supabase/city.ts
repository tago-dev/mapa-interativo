import { supabase } from './client';
import { Cidade, CidadeCompleta, Vereador, Cooperativa, Empresario, Imprensa } from '@/types/types';

export async function fetchCityData(id: string): Promise<CidadeCompleta | null> {
    // Busca dados da cidade
    const { data: cidade, error: cidadeError } = await supabase
        .from('cidades')
        .select('*')
        .eq('id', id)
        .single();

    if (cidadeError) {
        console.error('Erro ao buscar cidade:', cidadeError);
        return null;
    }

    if (!cidade) return null;

    // Busca dados relacionados em paralelo
    const [vereadoresRes, cooperativasRes, empresariosRes, imprensaRes] = await Promise.all([
        supabase.from('vereadores').select('*').eq('cidade_id', id),
        supabase.from('cooperativas').select('*').eq('cidade_id', id),
        supabase.from('empresarios').select('*').eq('cidade_id', id),
        supabase.from('imprensa').select('*').eq('cidade_id', id)
    ]);

    return {
        ...cidade,
        vereadores: vereadoresRes.data || [],
        cooperativas: cooperativasRes.data || [],
        empresarios: empresariosRes.data || [],
        imprensa: imprensaRes.data || []
    };
}

export async function fetchAllCities(): Promise<Cidade[]> {
    const { data, error } = await supabase
        .from('cidades')
        .select('*');

    if (error) {
        console.error('Erro ao buscar cidades:', error);
        return [];
    }
    return data || [];
}

export async function upsertCityData(data: Partial<Cidade>) {
    const { error } = await supabase
        .from('cidades')
        .upsert(data, { onConflict: 'id' });

    if (error) throw error;
}

export async function bulkUpsertCities(cities: Partial<Cidade>[]) {
    // Processa em lotes de 25 para evitar timeout
    const batchSize = 25;
    const results: Cidade[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < cities.length; i += batchSize) {
        const batch = cities.slice(i, i + batchSize);
        
        try {
            const { data, error } = await supabase
                .from('cidades')
                .upsert(batch, { onConflict: 'id' })
                .select();

            if (error) {
                console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
                console.error('Dados do lote:', JSON.stringify(batch, null, 2));
                errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
                // Continua para o próximo lote em vez de parar tudo
                continue;
            }
            
            if (data) {
                results.push(...data);
            }
        } catch (err) {
            console.error(`Exceção no lote ${Math.floor(i / batchSize) + 1}:`, err);
            errors.push(`Lote ${Math.floor(i / batchSize) + 1}: Erro inesperado`);
        }
    }
    
    // Se todos os lotes falharam, lança erro
    if (results.length === 0 && errors.length > 0) {
        throw new Error(`Falha ao importar: ${errors.join('; ')}`);
    }
    
    // Se alguns lotes falharam mas outros funcionaram, retorna os resultados
    if (errors.length > 0) {
        console.warn(`${errors.length} lotes falharam, ${results.length} registros importados`);
    }
    
    return results;
}

// Atualiza apenas cidades existentes (não insere novas)
export async function bulkUpdateCities(cities: Partial<Cidade>[]) {
    const batchSize = 25;
    const results: Cidade[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < cities.length; i += batchSize) {
        const batch = cities.slice(i, i + batchSize);
        
        // Atualizar cada cidade individualmente
        for (const city of batch) {
            if (!city.id) continue;
            
            try {
                // Remove o id do objeto para o update
                const { id, ...updateData } = city;
                
                const { data, error } = await supabase
                    .from('cidades')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    console.error(`Erro ao atualizar cidade ${id}:`, error);
                    errors.push(`Cidade ${id}: ${error.message}`);
                    continue;
                }
                
                if (data) {
                    results.push(data);
                }
            } catch (err) {
                console.error(`Exceção ao atualizar cidade ${city.id}:`, err);
                errors.push(`Cidade ${city.id}: Erro inesperado`);
            }
        }
    }
    
    if (results.length === 0 && errors.length > 0) {
        throw new Error(`Falha ao atualizar: ${errors.join('; ')}`);
    }
    
    return results;
}

// --- Vereadores ---

export async function addVereador(vereador: Omit<Vereador, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('vereadores')
        .insert(vereador)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function bulkInsertVereadores(vereadores: Omit<Vereador, 'id' | 'created_at'>[]) {
    // Processa em lotes de 50 para evitar timeout
    const batchSize = 50;
    const results: Vereador[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < vereadores.length; i += batchSize) {
        const batch = vereadores.slice(i, i + batchSize);
        
        try {
            const { data, error } = await supabase
                .from('vereadores')
                .insert(batch)
                .select();

            if (error) {
                console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
                errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
                continue;
            }
            
            if (data) {
                results.push(...data);
            }
        } catch (err) {
            console.error(`Exceção no lote ${Math.floor(i / batchSize) + 1}:`, err);
            errors.push(`Lote ${Math.floor(i / batchSize) + 1}: Erro inesperado`);
        }
    }
    
    if (results.length === 0 && errors.length > 0) {
        throw new Error(`Falha ao importar: ${errors.join('; ')}`);
    }
    
    return results;
}

export async function deleteAllVereadoresByCidade(cidadeId: string) {
    const { error } = await supabase
        .from('vereadores')
        .delete()
        .eq('cidade_id', cidadeId);

    if (error) throw error;
}

export async function deleteAllVereadores() {
    const { error } = await supabase
        .from('vereadores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos (workaround)

    if (error) throw error;
}

export async function updateVereador(id: string, data: Partial<Vereador>) {
    const { error } = await supabase
        .from('vereadores')
        .update(data)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteVereador(id: string) {
    const { error } = await supabase
        .from('vereadores')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// --- Cooperativas ---

export async function addCooperativa(cooperativa: Omit<Cooperativa, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('cooperativas')
        .insert(cooperativa)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCooperativa(id: string, data: Partial<Cooperativa>) {
    const { error } = await supabase
        .from('cooperativas')
        .update(data)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteCooperativa(id: string) {
    const { error } = await supabase
        .from('cooperativas')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// --- Empresarios ---

export async function addEmpresario(empresario: Omit<Empresario, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('empresarios')
        .insert(empresario)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateEmpresario(id: string, data: Partial<Empresario>) {
    const { error } = await supabase
        .from('empresarios')
        .update(data)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteEmpresario(id: string) {
    const { error } = await supabase
        .from('empresarios')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// --- Imprensa ---

export async function addImprensa(imprensa: Omit<Imprensa, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('imprensa')
        .insert(imprensa)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateImprensa(id: string, data: Partial<Imprensa>) {
    const { error } = await supabase
        .from('imprensa')
        .update(data)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteImprensa(id: string) {
    const { error } = await supabase
        .from('imprensa')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

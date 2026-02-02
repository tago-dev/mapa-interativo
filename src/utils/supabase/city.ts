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
    const { data, error } = await supabase
        .from('cidades')
        .upsert(cities, { onConflict: 'id' })
        .select();

    if (error) throw error;
    return data;
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

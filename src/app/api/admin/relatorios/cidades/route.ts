import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const parseNumber = (value: string | null) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (user.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    try {
        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get("search")?.trim();
        const mesorregiao = searchParams.get("mesorregiao")?.trim();
        const statusPrefeito = searchParams.get("statusPrefeito")?.trim();
        const statusVice = searchParams.get("statusVice")?.trim();

        const eleitoresMin = parseNumber(searchParams.get("eleitoresMin"));
        const eleitoresMax = parseNumber(searchParams.get("eleitoresMax"));
        const votosValidosMin = parseNumber(searchParams.get("votosValidosMin"));
        const votosValidosMax = parseNumber(searchParams.get("votosValidosMax"));
        const totalVotosMin = parseNumber(searchParams.get("totalVotosMin"));
        const totalVotosMax = parseNumber(searchParams.get("totalVotosMax"));

        const supabase = await createClient();
        let query = supabase
            .from("cidades")
            .select(
                "id, name, mesorregiao, prefeito, partido, status_prefeito, status_vice, eleitores, votos_validos, total_votos",
                { count: "exact" }
            )
            .order("name", { ascending: true });

        if (search) query = query.ilike("name", `%${search}%`);
        if (mesorregiao && mesorregiao !== "all") query = query.eq("mesorregiao", mesorregiao);
        if (statusPrefeito && statusPrefeito !== "all") query = query.eq("status_prefeito", statusPrefeito);
        if (statusVice && statusVice !== "all") query = query.eq("status_vice", statusVice);

        if (eleitoresMin !== undefined) query = query.gte("eleitores", eleitoresMin);
        if (eleitoresMax !== undefined) query = query.lte("eleitores", eleitoresMax);
        if (votosValidosMin !== undefined) query = query.gte("votos_validos", votosValidosMin);
        if (votosValidosMax !== undefined) query = query.lte("votos_validos", votosValidosMax);
        if (totalVotosMin !== undefined) query = query.gte("total_votos", totalVotosMin);
        if (totalVotosMax !== undefined) query = query.lte("total_votos", totalVotosMax);

        const { data, error, count } = await query;

        if (error) {
            console.error("Erro ao buscar relatório de cidades:", error);
            return NextResponse.json({ error: "Erro ao buscar relatório" }, { status: 500 });
        }

        return NextResponse.json({
            data: data ?? [],
            meta: {
                count: count ?? 0,
            },
        });
    } catch (error) {
        console.error("Erro na rota de relatório de cidades:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

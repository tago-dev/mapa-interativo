import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    try {
        const client = await clerkClient();
        
        // Atualiza os metadados públicos do usuário para indicar que solicitou acesso
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                accessStatus: "pending",
                accessRequestedAt: new Date().toISOString(),
            },
        });

        return NextResponse.json({ success: true, message: "Solicitação enviada" });
    } catch (error) {
        console.error("Erro ao solicitar acesso:", error);
        return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
    }
}

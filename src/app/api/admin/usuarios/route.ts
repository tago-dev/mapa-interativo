import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Aprovar acesso de um usuário
export async function POST(req: NextRequest) {
    const { userId: adminId } = await auth();

    if (!adminId) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verifica se o usuário atual é admin
    const client = await clerkClient();
    const admin = await client.users.getUser(adminId);
    
    if (admin.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { userId, action } = await req.json();

    if (!userId || !action) {
        return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    try {
        if (action === "approve") {
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    accessStatus: "approved",
                    accessApprovedAt: new Date().toISOString(),
                    accessApprovedBy: adminId,
                },
            });
        } else if (action === "reject") {
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    accessStatus: "rejected",
                    accessRejectedAt: new Date().toISOString(),
                    accessRejectedBy: adminId,
                },
            });
        } else if (action === "revoke") {
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    accessStatus: "revoked",
                    accessRevokedAt: new Date().toISOString(),
                    accessRevokedBy: adminId,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao gerenciar acesso:", error);
        return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
    }
}

// Listar usuários pendentes
export async function GET() {
    const { userId: adminId } = await auth();

    if (!adminId) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const client = await clerkClient();
    const admin = await client.users.getUser(adminId);
    
    if (admin.publicMetadata?.role !== "admin") {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    try {
        const users = await client.users.getUserList({ limit: 100 });
        
        const pendingUsers = users.data.filter(
            (user) => user.publicMetadata?.accessStatus === "pending"
        );

        const allUsers = users.data.map((user) => ({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            name: user.fullName || user.firstName || "Sem nome",
            imageUrl: user.imageUrl,
            accessStatus: user.publicMetadata?.accessStatus || "none",
            accessRequestedAt: user.publicMetadata?.accessRequestedAt,
            role: user.publicMetadata?.role,
        }));

        return NextResponse.json({ 
            pending: pendingUsers.length,
            users: allUsers 
        });
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
    }
}

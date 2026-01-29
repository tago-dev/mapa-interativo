"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <SignIn
                    appearance={{
                        baseTheme: dark,
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl",
                            headerTitle: "text-white",
                            headerSubtitle: "text-slate-400",
                            socialButtonsBlockButton: "bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
                            dividerLine: "bg-slate-700",
                            dividerText: "text-slate-500",
                            formFieldLabel: "text-slate-300",
                            formFieldInput: "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500",
                            formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
                            footerActionLink: "text-blue-400 hover:text-blue-300",
                            identityPreviewText: "text-white",
                            identityPreviewEditButton: "text-blue-400",
                        },
                        variables: {
                            colorPrimary: "#2563eb",
                            colorBackground: "#0f172a",
                            colorInputBackground: "#1e293b",
                            colorInputText: "#ffffff",
                        },
                    }}
                    forceRedirectUrl="/app/mapa"
                    signUpUrl="/cadastro"
                />
            </div>
        </main>
    );
}

import MapaBrasil from "./components/MapaBrasil";

export default function Page() {
    return (
        <main className="h-[calc(100dvh-52px)] min-h-[calc(100vh-52px)] w-full flex flex-col overflow-hidden">
            <div className="flex-1 relative">
                <MapaBrasil />
            </div>
        </main>
    );
}

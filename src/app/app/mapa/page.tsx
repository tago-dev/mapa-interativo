import MapaBrasil from "./components/MapaBrasil";

export default function Page() {
    return (
        <main className="h-screen w-full flex flex-col">
            <div className="flex-1 relative">
                <MapaBrasil />
            </div>
        </main>
    );
}

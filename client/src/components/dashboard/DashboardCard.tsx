import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import {
    Pencil,
    Settings,
    Trash2,
    Download,
    Calendar,
    Undo2
} from "lucide-react";
import { toast } from "sonner";

interface DashboardCardProps {
    title: string;
    children: ReactNode;
    className?: string; // For grid spans
    showControls?: boolean; // Toggle header icons
    onExport?: () => void;
    onDelete?: () => void;
    data?: any[]; // For export
}

export function DashboardCard({
    title,
    children,
    className,
    showControls = true,
    onExport,
    onDelete,
    data
}: DashboardCardProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleExport = () => {
        if (onExport) return onExport();

        // Default CSV Export logic
        const content = data ? JSON.stringify(data, null, 2) : "Timestamp,Value\n" + new Date().toISOString() + ",74.5";
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${title.toLowerCase().replace(/\s/g, '_')}_data.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success(`Exported ${title} data as CSV`);
    };

    const handleDelete = () => {
        setIsVisible(false);
        toast("Card hidden", {
            description: `The ${title} widget has been removed from view.`,
            action: {
                label: "Undo",
                onClick: () => setIsVisible(true),
            },
        });
        if (onDelete) onDelete();
    };

    const handleAction = (action: string) => {
        switch (action) {
            case "Filter":
                toast.info(`Filtering ${title}...`, {
                    description: "Showing data from the last 24 hours."
                });
                break;
            case "Edit":
                toast.info(`Configuring ${title}`, {
                    description: "Widget editor coming in the next update."
                });
                break;
            case "Settings":
                toast.info(`${title} Settings`, {
                    description: "Advanced parameters and alert thresholds."
                });
                break;
        }
    };

    if (!isVisible) return null;

    return (
        <div className={cn("glass-panel flex flex-col overflow-hidden animate-in zoom-in duration-300", className)}>
            {/* Card Header */}
            <div className="h-10 px-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white/80 tracking-wide uppercase">{title}</h3>

                {/* Header Actions */}
                {showControls && (
                    <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-all duration-300">
                        <button
                            onClick={() => handleAction("Filter")}
                            className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Filter by Date"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleExport}
                            className="p-1.5 hover:text- emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                            title="Export Data"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <div className="w-px h-3 bg-white/10 mx-0.5" />
                        <button
                            onClick={() => handleAction("Edit")}
                            className="p-1.5 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Edit Widget"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAction("Settings")}
                            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Widget Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Remove Widget"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Card Body */}
            <div className="p-4 flex-1 relative min-h-[150px]">
                {children}
            </div>
        </div>
    );
}

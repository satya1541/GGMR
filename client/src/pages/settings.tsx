import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    User,
    ShieldCheck,
    MapPin,
    Save,
    Loader2
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const updateProfileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof updateProfileSchema>;

export default function SettingsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            fullName: user?.fullName || "",
            location: user?.location || "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: ProfileFormValues) => {
            const res = await apiRequest("PATCH", "/api/user", data);
            return await res.json();
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(["/api/user"], updatedUser);
            toast.success("Profile updated successfully");
        },
        onError: (error: Error) => {
            toast.error(`Update failed: ${error.message}`);
        },
    });

    function onSubmit(data: ProfileFormValues) {
        updateMutation.mutate(data);
    }

    // Determine role badge color
    const roleColor = user?.role === 'admin' ? 'text-primary' : 'text-blue-400';
    const roleBg = user?.role === 'admin' ? 'bg-primary/10' : 'bg-blue-400/10';

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Settings Card */}
                <DashboardCard title="Profile Settings">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Role Display - Prominent as requested */}
                            <div className={`p-4 rounded-lg border border-border/50 ${roleBg} flex items-center gap-4`}>
                                <div className={`p-2 rounded-full bg-black/20 ${roleColor}`}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Type</h4>
                                    <div className={`text-xl font-bold ${roleColor} capitalize`}>
                                        {user?.role || "User"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase text-muted-foreground">Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9 bg-black/20 border-white/10" placeholder="John Doe" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs uppercase text-muted-foreground">Location</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9 bg-black/20 border-white/10" placeholder="New York, USA" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DashboardCard>

                {/* System Info / Other Settings Placeholder */}
                <DashboardCard title="System Information">
                    <div className="space-y-4 p-2">
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-muted-foreground text-sm">User ID</span>
                            <span className="font-mono text-white">#{user?.id}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-muted-foreground text-sm">Username</span>
                            <span className="font-mono text-white">@{user?.username}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-muted-foreground text-sm">Current Session</span>
                            <span className="text-green-400 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Active
                            </span>
                        </div>

                        <div className="mt-6 p-4 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs">
                            <strong>Note:</strong> Some settings are managed by your administrator. Contact support for role changes.
                        </div>
                    </div>
                </DashboardCard>
            </div>
        </DashboardLayout>
    );
}

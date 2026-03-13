"use client";

export default function LoadingSkeleton() {
    return (
        <div className="p-5 space-y-4">
            <div className="skeleton h-5 w-32" />
            <div className="space-y-3">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-9 w-full" />
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-9 w-full" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <div className="skeleton h-3 w-16" />
                        <div className="skeleton h-9 w-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-3 w-20" />
                        <div className="skeleton h-9 w-full" />
                    </div>
                </div>
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-24 w-full" />
            </div>
            <div className="pt-2">
                <div className="skeleton h-10 w-full" />
            </div>
        </div>
    );
}

export function PreviewSkeleton() {
    return (
        <div className="paper">
            <div className="space-y-6">
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <div className="skeleton h-4 w-40" />
                        <div className="skeleton h-3 w-32" />
                        <div className="skeleton h-3 w-28" />
                    </div>
                    <div className="skeleton h-3 w-24" />
                </div>
                <div className="space-y-2 pt-6">
                    <div className="skeleton h-3 w-36" />
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton h-3 w-28" />
                </div>
                <div className="pt-4 space-y-2">
                    <div className="skeleton h-5 w-64" />
                </div>
                <div className="pt-2 space-y-2">
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-4/6" />
                </div>
                <div className="pt-8 space-y-2">
                    <div className="skeleton h-3 w-40" />
                    <div className="skeleton h-3 w-36" />
                </div>
            </div>
        </div>
    );
}

"use client";

interface AdminHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function AdminHeader({ title, description, children }: AdminHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            {children}
        </div>
    );
}
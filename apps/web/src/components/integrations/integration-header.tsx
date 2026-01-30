import type { ReactNode } from 'react';

interface Badge {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface IntegrationHeaderProps {
  icon: ReactNode;
  title: ReactNode;
  description?: string;
  badges?: Badge[];
  actions?: ReactNode;
}

const badgeStyles = {
  default: 'bg-surface-3 text-text-muted',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-400',
  error: 'bg-red-500/10 text-red-400',
};

export function IntegrationHeader({
  icon,
  title,
  description,
  badges = [],
  actions,
}: IntegrationHeaderProps) {
  return (
    <header>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center">{icon}</div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`px-2 py-0.5 rounded text-xs ${badgeStyles[badge.variant || 'default']}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-text-muted">{description}</p>}
    </header>
  );
}

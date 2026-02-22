import { ArrowRight, Check, Circle } from 'lucide-react';
import { Button } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';

interface IssuesBlockProps {
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  cardPaymentsActive: boolean;
  requirements: {
    currentlyDue: string[];
    pastDue: string[];
  };
  onCompleteOnboarding: () => void;
}

interface StatusItem {
  label: string;
  complete: boolean;
}

// Format requirement keys into readable text
function formatRequirement(requirement: string): string {
  return requirement
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusChecklist({ items }: { items: StatusItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div
            className={cn(
              'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0',
              item.complete
                ? 'bg-foreground'
                : 'border border-muted-foreground/30'
            )}
          >
            {item.complete && <Check className="h-3 w-3 text-background" />}
          </div>
          <span
            className={cn(
              'text-sm',
              item.complete ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function RequirementsList({ requirements }: { requirements: string[] }) {
  if (!requirements || requirements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {requirements.map((req) => (
        <div key={req} className="flex items-center gap-3">
          <Circle className="h-1.5 w-1.5 fill-muted-foreground text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            {formatRequirement(req)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IssuesBlock({
  chargesEnabled,
  detailsSubmitted,
  payoutsEnabled,
  cardPaymentsActive,
  requirements,
  onCompleteOnboarding,
}: IssuesBlockProps) {
  const hasPastDue = requirements.pastDue && requirements.pastDue.length > 0;
  const hasCurrentlyDue =
    requirements.currentlyDue && requirements.currentlyDue.length > 0;

  const statusItems: StatusItem[] = [
    { label: 'Account details', complete: detailsSubmitted },
    { label: 'Payment processing', complete: chargesEnabled },
    { label: 'Payouts', complete: payoutsEnabled },
    { label: 'Card payments', complete: cardPaymentsActive },
  ];

  const completedCount = statusItems.filter((s) => s.complete).length;
  const totalCount = statusItems.length;
  const allComplete =
    completedCount === totalCount && !hasPastDue && !hasCurrentlyDue;

  if (allComplete) {
    return null;
  }

  const allRequirements = [
    ...new Set([
      ...(requirements.pastDue || []),
      ...(requirements.currentlyDue || []),
    ]),
  ];

  return (
    <div className="mt-6 pt-6 border-t border-border w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Complete account setup
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} of {totalCount} steps completed
            </p>
          </div>
          <Button size="sm" onClick={onCompleteOnboarding}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* Status checklist */}
        <StatusChecklist items={statusItems} />

        {/* Additional requirements */}
        {allRequirements.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Information needed
            </p>
            <RequirementsList requirements={allRequirements} />
          </div>
        )}
      </div>
    </div>
  );
}

import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@bounty/ui/components/button';
import { RequirementsList } from './requirements-list';

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

export function IssuesBlock({
  chargesEnabled,
  detailsSubmitted,
  payoutsEnabled,
  cardPaymentsActive,
  requirements,
  onCompleteOnboarding,
}: IssuesBlockProps) {
  const hasPendingRequirements =
    (requirements.currentlyDue && requirements.currentlyDue.length > 0) ||
    (requirements.pastDue && requirements.pastDue.length > 0);

  const issues: Array<{
    title: string;
    description: string;
    action: string;
    onAction: () => void;
  }> = [];

  if (!chargesEnabled) {
    issues.push({
      title: 'Charges not enabled',
      description: 'Your Stripe account cannot process payments yet.',
      action: 'Complete onboarding',
      onAction: onCompleteOnboarding,
    });
  }

  if (!detailsSubmitted) {
    issues.push({
      title: 'Account details incomplete',
      description: 'You need to submit your account information to Stripe.',
      action: 'Complete onboarding',
      onAction: onCompleteOnboarding,
    });
  }

  if (!payoutsEnabled) {
    issues.push({
      title: 'Payouts not enabled',
      description: 'You cannot receive payouts until this is enabled.',
      action: 'Complete onboarding',
      onAction: onCompleteOnboarding,
    });
  }

  if (!cardPaymentsActive) {
    issues.push({
      title: 'Card payments inactive',
      description: 'Card payment capability needs to be activated.',
      action: 'Complete onboarding',
      onAction: onCompleteOnboarding,
    });
  }

  if (hasPendingRequirements) {
    issues.push({
      title: 'Pending requirements',
      description: 'Stripe requires additional information to complete your account setup.',
      action: 'Complete onboarding',
      onAction: onCompleteOnboarding,
    });
  }

  // Don't render if there are no issues
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-4">
      {issues.map((issue, index) => (
        <div
          key={index}
          className="rounded-lg border border-destructive/50 bg-destructive/5 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{issue.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={issue.onAction}
                className="mt-2"
              >
                {issue.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {requirements.pastDue && requirements.pastDue.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Past Due Requirements
                </h4>
                <RequirementsList
                  requirements={requirements.pastDue}
                  variant="error"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onCompleteOnboarding}
              className="mt-2"
            >
              Complete onboarding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {requirements.currentlyDue && requirements.currentlyDue.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Currently Due Requirements
                </h4>
                <RequirementsList
                  requirements={requirements.currentlyDue}
                  variant="default"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onCompleteOnboarding}
              className="mt-2"
            >
              Complete onboarding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

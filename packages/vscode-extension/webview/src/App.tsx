import { useState } from 'react';
import { LoginView } from './components/LoginView';
import { BountiesView } from './components/BountiesView';
import { BountyDetailView } from './components/BountyDetailView';
import type { Bounty } from './types';

interface AppProps {
  isAuthenticated: boolean;
}

type ViewState = { type: 'list' } | { type: 'detail'; bountyId: string };

export function App({ isAuthenticated }: AppProps) {
  const [viewState, setViewState] = useState<ViewState>({ type: 'list' });

  if (!isAuthenticated) {
    return <LoginView />;
  }

  if (viewState.type === 'detail') {
    return (
      <BountyDetailView
        bountyId={viewState.bountyId}
        onBack={() => setViewState({ type: 'list' })}
      />
    );
  }

  return (
    <BountiesView
      onOpenBounty={(bounty) =>
        setViewState({ type: 'detail', bountyId: bounty.id })
      }
    />
  );
}

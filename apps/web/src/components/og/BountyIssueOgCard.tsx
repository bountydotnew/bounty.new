type Props = {
  owner: string;
  repo: string;
  issueNumber: string | number;
  title: string;
  amount?: string;
  currency?: string;
  logo?: React.ReactNode;
};

// function gradientFor(key: string) {
//   const palettes = [
//     ['#0ea5e9', '#22d3ee'],
//     ['#8b5cf6', '#ec4899'],
//     ['#10b981', '#84cc16'],
//     ['#f59e0b', '#ef4444'],
//   ];
//   let hash = 0;
//   for (let i = 0; i < key.length; i++)
//     hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
//   const [a, b] = palettes[hash % palettes.length];
//   return `linear-gradient(135deg, ${a}, ${b})`;
// }

function currencyToSymbol(code?: string) {
  switch ((code || 'USD').toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return (code || 'USD').toUpperCase();
  }
}

function BountyIssueOgCard({
  owner,
  repo,
  issueNumber,
  title,
  amount,
  currency,
  logo,
}: Props) {
  const displayAmount = amount ? `${currencyToSymbol(currency)} ${amount}` : '';

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        padding: 64,
        color: '#fbfbfb',
        background: '#252525',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {logo}
          <div style={{ fontSize: 32, fontWeight: 700 }}>Bounty.new</div>
        </div>
        {displayAmount && (
          <div style={{ fontSize: 36, fontWeight: 800 }}>{displayAmount}</div>
        )}
      </div>

      <div
        style={{
          marginTop: 48,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          background: '#343434',
        }}
      >
        <div style={{ padding: 36 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 26,
              color: '#b5b5b5',
            }}
          >
            <span>
              {owner}/{repo}
            </span>
            <span>•</span>
            <span>#{String(issueNumber)}</span>
          </div>
          <div style={{ height: 12 }} />
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              lineHeight: 1.06,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BountyIssueOgCard;

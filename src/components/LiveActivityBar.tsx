import React, { useMemo } from 'react';
import { TicketIcon } from 'lucide-react';
import { useGetRecentActivityQuery } from '../store/api/recentActivityApi';

const POLLING_INTERVAL_MS = 45000;

function formatMessage(firstName: string, location: string | null, ticketCount: number): string {
  const tickets = ticketCount === 1 ? '1 ticket' : `${ticketCount} tickets`;
  if (location) {
    return `${firstName} from ${location} just bought ${tickets}`;
  }
  return `${firstName} just bought ${tickets}`;
}

export function LiveActivityBar() {
  const { data, isLoading, isError } = useGetRecentActivityQuery(undefined, {
    pollingInterval: POLLING_INTERVAL_MS,
  });

  const { aggregateMessage, purchaseMessages } = useMemo(() => {
    if (!data) return { aggregateMessage: null, purchaseMessages: [] };
    const aggregate =
      data.tickets_in_last_minutes > 0 && data.last_minutes > 0
        ? `${data.tickets_in_last_minutes} tickets purchased in the last ${data.last_minutes} minutes`
        : null;
    const purchases = data.recent_purchases
      .filter((p) => p.ticket_count > 0)
      .map((p) => formatMessage(p.first_name, p.location, p.ticket_count));
    return { aggregateMessage: aggregate, purchaseMessages: purchases };
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-black/80 text-white py-2 px-4 border-b border-white/10" role="region" aria-label="Live activity">
        <div className="container-premium flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0 text-accent">
            <TicketIcon className="w-4 h-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">People are buying</span>
          </div>
          <div className="text-sm text-white/60 animate-pulse">Loading…</div>
        </div>
      </div>
    );
  }

  if (isError || (!aggregateMessage && purchaseMessages.length === 0)) {
    return (
      <div className="bg-black/80 text-white py-2 px-4 text-center text-sm border-b border-white/10" role="region" aria-label="Live activity">
        <div className="container-premium flex items-center justify-center gap-2">
          <TicketIcon className="w-4 h-4 text-accent shrink-0" aria-hidden />
          <span className="opacity-90">Be the first to enter today.</span>
        </div>
      </div>
    );
  }

  const tickerContent = purchaseMessages.length > 0 ? purchaseMessages : [aggregateMessage];

  return (
    <div className="bg-black/80 text-white py-2 px-4 border-b border-white/10 overflow-hidden">
      <div className="container-premium flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 text-accent">
          <TicketIcon className="w-4 h-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">People are buying</span>
        </div>
        {aggregateMessage && (
          <div className="shrink-0 text-sm text-white/95 hidden sm:block">{aggregateMessage}</div>
        )}

        {/* Desktop / tablet: scrolling ticker as before */}
        <div className="min-w-0 flex-1 overflow-hidden hidden sm:block">
          <div className="flex gap-8 text-sm text-white/95 whitespace-nowrap animate-ticker w-max">
            {tickerContent.map((msg, i) => (
              <span key={`${i}-${msg?.slice(0, 20)}`}>{msg}</span>
            ))}
            {tickerContent.map((msg, i) => (
              <span key={`dup-${i}-${msg?.slice(0, 20)}`} aria-hidden>
                {msg}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile: simple, single-line message (no horizontal scroll) */}
        <div className="min-w-0 flex-1 sm:hidden">
          <div className="text-xs text-white/95 truncate">
            {tickerContent[0]}
          </div>
        </div>
      </div>
    </div>
  );
}

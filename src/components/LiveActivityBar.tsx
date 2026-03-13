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

  const tickerContent = purchaseMessages.length > 0 ? purchaseMessages : [aggregateMessage];

  // Desktop / tablet layout: keep top bar with ticker
  const desktopContent = (
    <div className="hidden md:block bg-black/80 text-white py-2 px-4 border-b border-white/10 overflow-hidden">
      <div className="container-premium flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 text-accent">
          <TicketIcon className="w-4 h-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">People are buying</span>
        </div>
        {aggregateMessage && (
          <div className="shrink-0 text-sm text-white/95">{aggregateMessage}</div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
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
      </div>
    </div>
  );

  // Mobile layout: compact card with up to 3 stacked messages
  const mobileMessages =
    tickerContent.filter((m): m is string => !!m && m.trim().length > 0).slice(0, 3);

  const mobileContent = (
    <div className="md:hidden px-4 pt-4">
      <div className="container-premium">
        <div className="rounded-xl border border-white/10 bg-black/70 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20">
              <TicketIcon className="w-3 h-3 text-accent" aria-hidden />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Live activity
            </span>
          </div>
          {isLoading && (
            <div className="text-xs text-white/60 animate-pulse">Checking recent entries…</div>
          )}
          {(isError || mobileMessages.length === 0) && !isLoading && (
            <div className="text-xs text-white/80">Be the first to enter today.</div>
          )}
          {!isLoading && mobileMessages.length > 0 && (
            <ul className="space-y-1 text-xs text-white/90">
              {mobileMessages.map((msg, i) => (
                <li key={`${i}-${msg.slice(0, 20)}`} className="flex gap-2">
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                  <span className="leading-snug">{msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileContent}
      {desktopContent}
    </>
  );
}

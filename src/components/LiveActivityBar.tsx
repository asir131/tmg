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

  // Mobile layout: more visual, single primary message + subtle aggregate
  const primaryMessage =
    purchaseMessages.find((m): m is string => !!m && m.trim().length > 0) ??
    (aggregateMessage as string | null);

  const secondaryMessage =
    aggregateMessage && aggregateMessage !== primaryMessage ? aggregateMessage : null;

  const mobileContent = (
    <div className="md:hidden px-4 pt-4">
      <div className="container-premium">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-black via-gray-900 to-black px-4 py-3 shadow-lg">
          {/* Accent strip */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-purple-500" />

          <div className="pl-3 flex items-start gap-3">
            <div className="mt-0.5 flex items-center justify-center w-7 h-7 rounded-full bg-accent/15 border border-accent/40">
              <TicketIcon className="w-3.5 h-3.5 text-accent" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                  Live activity
                </span>
                {!isLoading && !isError && (
                  <span className="text-[10px] text-white/60">Just now</span>
                )}
              </div>

              {isLoading && (
                <div className="text-xs text-white/70 animate-pulse">
                  Checking what people are entering…
                </div>
              )}

              {(isError || !primaryMessage) && !isLoading && (
                <div className="text-xs text-white/85">
                  No recent entries yet. Be the first to enter today.
                </div>
              )}

              {!isLoading && primaryMessage && (
                <>
                  <div className="text-xs text-white font-medium leading-snug">
                    {primaryMessage}
                  </div>
                  {secondaryMessage && (
                    <div className="mt-0.5 text-[11px] text-white/70 leading-snug">
                      {secondaryMessage}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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

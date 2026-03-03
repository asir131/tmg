import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, XIcon, PlayIcon, TrophyIcon } from "lucide-react";
import { SafeImage } from "../components/SafeImage";
import { useGetResultsQuery } from "../store/api/competitionsApi";

interface WinnerCard {
  id: string;
  competitionName: string;
  imageUrl: string;
  message: string;
  ticketNumber: string;
  announcedDate: string;
  prizeValue?: number;
  videoUrl?: string | null;
}

export function Winners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedWinner, setSelectedWinner] = useState<WinnerCard | null>(null);

  const { data, isLoading, error, refetch } = useGetResultsQuery(
    { recent_limit: 10, past_page: page, past_limit: 9 },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    }
  );

  const recentWinnerCards: WinnerCard[] = useMemo(() => {
    const recent = data?.data?.recentWinners ?? [];
    return recent.map((item) => ({
      id: item._id,
      competitionName: item.competition_name,
      imageUrl: item.image_url,
      message: item.message,
      ticketNumber: item.ticket_number,
      announcedDate: new Date(item.announced_at).toLocaleDateString("en-GB"),
      prizeValue: item.prize_value,
      videoUrl: undefined,
    }));
  }, [data]);

  const pastWinnerCards: WinnerCard[] = useMemo(() => {
    const past = data?.data?.pastWinners?.results ?? [];
    return past.map((item) => ({
      id: item._id,
      competitionName: item.competition_name,
      imageUrl: item.image_url,
      message: item.message,
      ticketNumber: item.ticket_number,
      announcedDate: new Date(item.announced_at).toLocaleDateString("en-GB"),
      prizeValue: item.prize_value,
      videoUrl: undefined,
    }));
  }, [data]);

  const filteredPastWinners = pastWinnerCards.filter(
    (winner) =>
      winner.competitionName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      winner.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      winner.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pagination = data?.data?.pastWinners?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="py-8">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-8">
            <TrophyIcon className="w-10 h-10 text-accent mr-4" />
            <h1 className="text-4xl font-bold">Winners</h1>
          </div>

          {/* Section: Recent Winners */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Recent Winners</h2>
            {/* Featured recent winner from API, if present */}
            {recentWinnerCards[0] && (
              <div className="mb-10 rounded-xl overflow-hidden border border-gray-700 bg-gradient-end grid grid-cols-1 md:grid-cols-4 gap-0 min-h-[280px]">
                <div className="md:col-span-1 flex items-center justify-center bg-gray-800/50 min-h-[200px] md:min-h-0">
                  <SafeImage
                    src={recentWinnerCards[0].imageUrl}
                    alt={recentWinnerCards[0].message}
                    className="w-full h-full max-h-[320px] md:max-h-none object-contain object-center"
                  />
                </div>
                <div className="md:col-span-3 flex flex-col items-center justify-center p-6 md:p-8 md:items-start">
                  <p className="text-lg md:text-xl text-white font-medium text-center md:text-left">
                    {recentWinnerCards[0].message}
                  </p>
                  <p className="text-text-secondary mt-2 text-center md:text-left">
                    Ticket number:{" "}
                    <span className="text-accent font-semibold">
                      {recentWinnerCards[0].ticketNumber}
                    </span>
                  </p>
                  <p className="text-text-secondary mt-1 text-center md:text-left">
                    Announced on {recentWinnerCards[0].announcedDate}
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <p className="text-text-secondary mb-4">Loading winners...</p>
            )}
            {error && (
              <div className="text-red-500 mb-4 space-y-2">
                <p>Failed to load winners.</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 transition-colors text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {recentWinnerCards.length > 1 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {recentWinnerCards.slice(1).map((winner) => (
                  <motion.div
                    key={winner.id}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedWinner(winner)}
                    className="card-premium overflow-hidden cursor-pointer group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <SafeImage
                        src={winner.imageUrl}
                        alt={winner.message}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-sm text-accent mb-1">
                          {winner.announcedDate}
                        </div>
                        <div className="text-lg font-bold mb-1">
                          {winner.message}
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-text-secondary mb-1">
                            Ticket Number
                          </div>
                          <div className="font-semibold">
                            {winner.ticketNumber}
                          </div>
                        </div>
                        {winner.prizeValue != null && (
                          <div className="text-right">
                            <div className="text-sm text-text-secondary mb-1">
                              Value
                            </div>
                            <div className="text-xl font-bold text-accent">
                              £{winner.prizeValue.toLocaleString("en-GB")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {/* Section: Past Winners */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Past Winners</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastWinners.map((winner) => (
                <motion.div
                  key={winner.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedWinner(winner)}
                  className="card-premium overflow-hidden cursor-pointer group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <SafeImage
                      src={winner.imageUrl}
                      alt={winner.message}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-sm text-accent mb-1">
                        {winner.announcedDate}
                      </div>
                      <div className="text-lg font-bold mb-1">
                        {winner.message}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-text-secondary mb-1">
                          Ticket Number
                        </div>
                        <div className="font-semibold">
                          {winner.ticketNumber}
                        </div>
                      </div>
                      {winner.prizeValue != null && (
                        <div className="text-right">
                          <div className="text-sm text-text-secondary mb-1">
                            Value
                          </div>
                          <div className="text-xl font-bold text-accent">
                            £{winner.prizeValue.toLocaleString("en-GB")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination for Past Winners */}
            {filteredPastWinners.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-text-secondary px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </motion.div>

        {/* Winner Details Modal */}
        <AnimatePresence>
          {selectedWinner && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedWinner(null)}
                className="fixed inset-0 bg-black bg-opacity-80 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="card-premium max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="relative">
                    <SafeImage
                      src={selectedWinner.prizeImage}
                      alt={selectedWinner.competitionTitle}
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={() => setSelectedWinner(null)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 flex items-center justify-center transition-colors"
                    >
                      <XIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">
                      {selectedWinner.competitionTitle}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-text-secondary mb-1">
                          Winner
                        </div>
                        <div className="font-semibold">
                          {selectedWinner.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-secondary mb-1">
                          Ticket Number
                        </div>
                        <div className="font-semibold">
                          {selectedWinner.ticketNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-secondary mb-1">
                          Win Date
                        </div>
                        <div className="font-semibold">
                          {selectedWinner.winDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-secondary mb-1">
                          Competition ID
                        </div>
                        <div className="font-semibold">{selectedWinner.id}</div>
                      </div>
                    </div>
                    {selectedWinner.videoUrl && (
                      <a
                        href={selectedWinner.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full btn-premium flex items-center justify-center"
                      >
                        <PlayIcon className="w-5 h-5 mr-2" />
                        Watch Live Draw Replay
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

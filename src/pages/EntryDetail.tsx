import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { SafeImage } from "../components/SafeImage";
import {
  useGetCompetitionTicketsQuery,
  useGetCompetitionByIdQuery,
} from "../store/api/competitionsApi";

export function EntryDetail() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: competitionData,
    isLoading: isCompetitionLoading,
    error: competitionError,
  } = useGetCompetitionByIdQuery(id || "", { skip: !id });

  const { data, isLoading, error } = useGetCompetitionTicketsQuery(
    { id: id || "", page: currentPage, limit: itemsPerPage },
    { skip: !id }
  );

  const participants = data?.data?.tickets ?? [];
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.total ?? participants.length;

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchName = p.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchTicket = p.ticket_number.includes(searchQuery);
      return matchName || matchTicket;
    });
  }, [participants, searchQuery]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="py-8">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/entries"
            className="inline-flex items-center text-accent hover:underline mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Entries
          </Link>

          <div className="card-premium p-6 mb-8">
            {isCompetitionLoading && (
              <p className="text-text-secondary">Loading competition...</p>
            )}
            {competitionError && (
              <p className="text-red-500">Failed to load competition.</p>
            )}
            {competitionData?.data?.competition && (
              <div className="flex flex-col md:flex-row gap-6">
                <SafeImage
                  src={competitionData.data.competition.image_url}
                  alt={competitionData.data.competition.title}
                  className="w-full md:w-48 h-48 object-cover rounded-xl"
                />
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold mb-3">
                    {competitionData.data.competition.title}
                  </h1>
                  <p className="text-text-secondary mb-4">
                    {competitionData.data.competition.short_description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-text-secondary mb-1">
                        Total Tickets
                      </div>
                      <div className="text-lg font-bold">
                        {competitionData.data.competition.max_tickets}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary mb-1">
                        Sold
                      </div>
                      <div className="text-lg font-bold">
                        {competitionData.data.competition.tickets_sold}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary mb-1">
                        Price
                      </div>
                      <div className="text-lg font-bold">
                        £{competitionData.data.competition.ticket_price}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary mb-1">
                        Draw Date
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(
                          competitionData.data.competition.draw_time
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card-premium p-6">
            <h2 className="text-2xl font-bold mb-6">Competition Participants</h2>
            {isLoading && (
              <p className="text-text-secondary mb-4">Loading tickets...</p>
            )}
            {error && (
              <p className="text-red-500 mb-4">Failed to load tickets.</p>
            )}

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or ticket number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors"
                />
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">
                      Ticket Number
                    </th>
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">
                      Entry Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant, index) => (
                    <motion.tr
                      key={`${participant.ticket_number}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-text-secondary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-4 px-4 font-medium">
                        {participant.username}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-gradient-end rounded-lg text-sm font-medium">
                          {participant.ticket_number}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        {new Date(participant.date_time).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                  {filteredParticipants.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-text-secondary"
                      >
                        No participants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing{" "}
                {filteredParticipants.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}{" "}
                to {(currentPage - 1) * itemsPerPage + filteredParticipants.length} of{" "}
                {totalItems} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      typeof page === "number" && setCurrentPage(page)
                    }
                    disabled={page === "..."}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? "bg-accent text-white"
                        : page === "..."
                        ? "cursor-default"
                        : "bg-gradient-end hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

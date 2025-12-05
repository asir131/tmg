import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SearchIcon, TicketIcon, CalendarIcon, FilterIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetMyCompetitionsQuery } from "../store/api/competitionsApi";
import { SafeImage } from "../components/SafeImage";
import { log } from "console";

export function EntryList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetMyCompetitionsQuery(
    undefined,
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    }
  );

  const entries = data?.data?.competitions ?? [];

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = entry.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : entry.status === statusFilter;
      // selectedCompetition filter placeholder; no category info in API response
      const matchesCompetition = selectedCompetition === "all";
      return matchesSearch && matchesStatus && matchesCompetition;
    });
  }, [entries, searchQuery, statusFilter, selectedCompetition]);

  // According to API contract: total_purchased_tickets => Total Entries, total_participated_competitions => Active
  const totalEntries = data?.data?.total_purchased_tickets ?? 0;
  const totalActive = data?.data?.total_participated_competitions ?? 0;
  const totalDrawn = entries.filter((e) => e.status === "drawn").length;
  const totalWon = entries.filter((e) => e.status === "won").length;
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "drawn":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "won":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };
  return (
    <div className="py-8">
      <div className="container-premium">
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div className="flex items-center mb-8">
            <TicketIcon className="w-10 h-10 text-accent mr-4" />
            <h1 className="text-4xl font-bold">My Entries</h1>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Entries",
                value: totalEntries.toLocaleString(),
                icon: TicketIcon,
              },
              {
                label: "Active",
                value: totalActive.toLocaleString(),
                icon: CalendarIcon,
              },
              {
                label: "Drawn",
                value: totalDrawn.toLocaleString(),
                icon: FilterIcon,
              },
              {
                label: "Won",
                value: totalWon.toLocaleString(),
                icon: TicketIcon,
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                className="card-premium p-4"
              >
                <stat.icon className="w-6 h-6 text-accent mb-2" />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Entries List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {isLoading && (
            <p className="text-text-secondary">Loading entries...</p>
          )}
          {error && (
            <div className="text-red-500 space-y-2">
              <p>Failed to load entries.</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 transition-colors text-white"
              >
                Retry
              </button>
            </div>
          )}
          {filteredEntries.map((entry) => (
            <motion.div
              key={entry._id}
              variants={itemVariants}
              onClick={() => navigate(`/entry/${entry._id}`)}
              className="card-premium p-6 cursor-pointer hover:border-accent transition-all"
              whileHover={{
                y: -2,
              }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <SafeImage
                  src={entry.image_url}
                  alt={entry.title}
                  className="w-full md:w-32 h-32 object-cover rounded-xl"
                />
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{entry.title}</h3>
                      <div className="text-sm text-text-secondary mb-8">
                        {/* Tickets purchased: {entry.total_purchased_tickets ?? 0} */}
                      </div>
                    </div>
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        entry.status
                      )}`}
                    >
                      {entry.status.charAt(0).toUpperCase() +
                        entry.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-text-secondary mb-1">
                        Purchase Date
                      </div>
                      <div className="font-medium">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary mb-1">Draw Date</div>
                      <div className="font-medium">
                        {new Date(entry.draw_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {!isLoading && !error && filteredEntries.length === 0 && (
            <p className="text-text-secondary">No entries found.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

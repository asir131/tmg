import React from "react";
import { motion } from "framer-motion";
import { PlayIcon, CalendarIcon, ClockIcon, UsersIcon } from "lucide-react";
import { CountdownTimer } from "../components/CountdownTimer";
import { SafeImage } from "../components/SafeImage";
import { useGetLiveStreamQuery } from "../store/api/competitionsApi";
import { useNavigate } from "react-router-dom";

export function LiveDraws() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetLiveStreamQuery();

  const live = data?.data;
  const liveDraw = live?.competition
    ? {
        id: live.competition._id,
        competitionTitle: live.competition.title,
        prizeImage: live.competition.image_url,
        drawDate: new Date(live.competition.draw_time),
        participants: live.stream?.viewerCount ?? 0,
        videoUrl: live.competition.live_draw_watching_url ?? undefined,
        isLive: live.is_live,
      }
    : null;

  return (
    <div className="py-8">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-8">
            <PlayIcon className="w-10 h-10 text-accent mr-4" />
            <h1 className="text-4xl font-bold">Live Draws</h1>
          </div>
          <div className="mb-8">
            <motion.button className="px-6 py-3 rounded-xl font-medium bg-accent text-white">
              Ongoing Draws
            </motion.button>
          </div>
        </motion.div>

        {isLoading && (
          <p className="text-text-secondary">Loading live draw...</p>
        )}
        {error && <p className="text-red-500">Failed to load live draw.</p>}

        {liveDraw ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div
              className="card-premium overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 relative">
                  <SafeImage
                    src={liveDraw.prizeImage}
                    alt={liveDraw.competitionTitle}
                    className="w-full h-64 md:h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 rounded-full px-4 py-2 text-sm font-bold flex items-center animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                    {liveDraw.isLive ? "LIVE NOW" : "UPCOMING"}
                  </div>
                </div>
                <div className="md:w-2/3 p-6">
                  <h3 className="text-2xl font-bold mb-4">
                    {liveDraw.competitionTitle}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="flex items-center text-text-secondary mb-1">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Draw Date
                      </div>
                      <div className="font-semibold">
                        {liveDraw.drawDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-text-secondary mb-1">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Participants
                      </div>
                      <div className="font-semibold">
                        {liveDraw.participants.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-sm text-text-secondary mb-3">
                      Time Until Draw
                    </div>
                    <CountdownTimer endDate={liveDraw.drawDate} />
                  </div>
                  {liveDraw.videoUrl && (
                    <button
                      className="w-full btn-premium flex items-center justify-center"
                      onClick={() => window.open(liveDraw.videoUrl, '_blank')}
                    >
                      <ClockIcon className="w-5 h-5 mr-2" />
                      Watch Live Draw
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          !isLoading &&
          !error && (
            <p className="text-text-secondary">No live draws at the moment.</p>
          )
        )}
      </div>
    </div>
  );
}

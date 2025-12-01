import React from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from './CountdownTimer';
import { SafeImage } from './SafeImage';
interface CompetitionCardProps {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  endDate: Date;
  totalTickets: number;
  soldTickets: number;
}
export function CompetitionCard({
  id,
  title,
  imageUrl,
  price,
  endDate,
  totalTickets,
  soldTickets
}: CompetitionCardProps) {
  const progressPercentage = Math.min(Math.round(soldTickets / totalTickets * 100), 100);
  return <div className="card-premium group">
      <div className="relative overflow-hidden">
        <SafeImage src={imageUrl} alt={title} className="w-full h-48 object-cover object-center transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-3 right-3 bg-accent rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg">
          £{price.toFixed(2)}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 text-white line-clamp-2">
          {title}
        </h3>
        <div className="mb-4">
          <CountdownTimer endDate={endDate} />
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">
              Tickets sold: {soldTickets}
            </span>
            <span className="text-text-secondary">Total: {totalTickets}</span>
          </div>
          <div className="w-full h-2 bg-gradient-end rounded-full overflow-hidden">
            <div className="h-full bg-accent" style={{
            width: `${progressPercentage}%`
          }} />
          </div>
        </div>
        <Link to={`/competition/${id}`} className="block w-full btn-premium text-center">
          Enter Now
        </Link>
      </div>
    </div>;
}

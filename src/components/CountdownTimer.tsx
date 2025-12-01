import React, { useEffect, useState } from 'react';
interface CountdownTimerProps {
  endDate: Date;
}
export function CountdownTimer({
  endDate
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(difference / (1000 * 60 * 60) % 24),
        minutes: Math.floor(difference / (1000 * 60) % 60),
        seconds: Math.floor(difference / 1000 % 60)
      });
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : num.toString();
  };
  return <div className="flex justify-between">
      <div className="text-center">
        <div className="bg-gradient-end rounded-lg w-12 h-12 flex items-center justify-center mb-1">
          <span className="text-lg font-bold">
            {formatNumber(timeLeft.days)}
          </span>
        </div>
        <span className="text-xs text-text-secondary">Days</span>
      </div>
      <div className="text-center">
        <div className="bg-gradient-end rounded-lg w-12 h-12 flex items-center justify-center mb-1">
          <span className="text-lg font-bold">
            {formatNumber(timeLeft.hours)}
          </span>
        </div>
        <span className="text-xs text-text-secondary">Hours</span>
      </div>
      <div className="text-center">
        <div className="bg-gradient-end rounded-lg w-12 h-12 flex items-center justify-center mb-1">
          <span className="text-lg font-bold">
            {formatNumber(timeLeft.minutes)}
          </span>
        </div>
        <span className="text-xs text-text-secondary">Mins</span>
      </div>
      <div className="text-center">
        <div className="bg-gradient-end rounded-lg w-12 h-12 flex items-center justify-center mb-1">
          <span className="text-lg font-bold">
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>
        <span className="text-xs text-text-secondary">Secs</span>
      </div>
    </div>;
}
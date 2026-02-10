import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CompetitionCard } from '../components/CompetitionCard';
import { motion } from 'framer-motion';
import { ArrowRightIcon, TrophyIcon, CalendarIcon, TicketIcon, UsersIcon, GiftIcon, PoundSterlingIcon, CoinsIcon } from 'lucide-react';
import { useGetCompetitionsQuery, useGetResultsQuery } from '../store/api/competitionsApi';
import { SafeImage } from '../components/SafeImage';

export function Home() {
  const navigate = useNavigate();
  const { data: competitionsData, error, isLoading } = useGetCompetitionsQuery({ page: 1, limit: 3 });
  const { data: winnersData, isLoading: winnersLoading, error: winnersError } = useGetResultsQuery({ page: 1, limit: 3 });
  const isAuthenticated = !!localStorage.getItem('accessToken');

  const recentWinners = (winnersData?.data?.results ?? []).map((winner) => ({
    id: winner._id,
    name: winner.user_id?.name || 'Winner',
    prize: winner.competition_id?.title || 'Competition',
    imageUrl: winner.competition_id?.image_url || '/Simplification.svg',
    winDate: new Date(winner.draw_date).toLocaleDateString('en-GB'),
    value: `£${(winner.prize_value ?? 0).toLocaleString('en-GB')}`,
  }));

  return <div>
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SafeImage src="/tmg-competiotion-VANS-1536x720.jpg" alt="Luxury prizes" className="w-full h-full object-cover object-[center_35%]"/>
          <div className="absolute inset-0 bg-black bg-opacity-70" />
        </div>
        <div className="container-premium relative z-10 h-full flex flex-col justify-center items-center text-center">
          <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Win <span className="text-accent">Incredible Prizes</span>
            <br />
            Change Your Life
          </motion.h1>
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl">
            Enter our premium competitions for a chance to win luxury cars,
            dream vacations, and life-changing cash prizes.
          </motion.p>
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.4
        }} className="flex flex-wrap gap-4 justify-center mb-12">
            <Link to="/competitions" className="btn-premium">
              Browse Competitions
            </Link>
            <Link to="/winners" className="py-3 px-6 rounded-xl border border-white/20 hover:bg-white/10 transition-colors">
              View Past Winners
            </Link>
          </motion.div>
          {/* Stats Cards */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.6
        }} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="bg-gradient-start bg-opacity-90 rounded-2xl p-6 backdrop-blur-sm">
              <div className="bg-accent rounded-xl p-3 w-fit mx-auto mb-3">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-sm text-text-secondary mb-1">
                Social Media Followers
              </div>
              <div className="text-3xl font-bold">300,000+</div>
            </div>
            <div className="bg-gradient-start bg-opacity-90 rounded-2xl p-6 backdrop-blur-sm">
              <div className="bg-accent rounded-xl p-3 w-fit mx-auto mb-3">
                <GiftIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-sm text-text-secondary mb-1">
                Prizes Given Away
              </div>
              <div className="text-3xl font-bold">100+</div>
            </div>
            <div className="bg-gradient-start bg-opacity-90 rounded-2xl p-6 backdrop-blur-sm">
              <div className="bg-accent rounded-xl p-3 w-fit mx-auto mb-3">
                <PoundSterlingIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-sm text-text-secondary mb-1">
                Total Prizes Won
              </div>
              <div className="text-3xl font-bold">£10,000+</div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Featured Competitions */}
      <section className="py-16">
        <div className="container-premium">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Featured Competitions</h2>
            <Link to="/competitions" className="flex items-center text-white hover:text-accent transition-colors font-medium">
              View All <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading && <p>Loading competitions...</p>}
            {error && <p>Error fetching competitions.</p>}
            {competitionsData && competitionsData.data.competitions.map(competition => (
              <CompetitionCard
                key={competition._id}
                id={competition._id}
                title={competition.title}
                imageUrl={competition.image_url}
                price={competition.ticket_price}
                endDate={new Date(competition.draw_countdown)}
                totalTickets={competition.max_tickets}
                soldTickets={competition.tickets_sold}
              />
            ))}
          </div>
        </div>
      </section>
      {/* Recent Winners */}
      <section className="py-16 premium-gradient">
        <div className="container-premium">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Recent Winners</h2>
            <Link to="/winners" className="flex items-center text-white hover:text-accent transition-colors font-medium">
              View All <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Featured Winner - Kevin Irvine / TMG Virtual Cockpit */}
          <div className="mb-10 rounded-xl overflow-hidden border border-gray-700 bg-gradient-end grid grid-cols-1 md:grid-cols-4 gap-0 min-h-[280px]">
            <div className="md:col-span-1 flex items-center justify-center bg-gray-800/50 min-h-[200px] md:min-h-0">
              <img
                src="/winner.png"
                alt="TMG Virtual Cockpit Competition Winner"
                className="w-full h-full max-h-[320px] md:max-h-none object-contain object-center"
              />
            </div>
            <div className="md:col-span-3 flex items-center justify-center p-6 md:p-8">
              <p className="text-lg md:text-xl text-white font-medium text-center md:text-left">
                Congratulations to Kevin Irvine the winner of the TMG VIRTUAL COCKPIT COMPETITION.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {winnersLoading && <p className="text-text-secondary">Loading winners...</p>}
            {winnersError && <p className="text-red-500">Failed to load winners.</p>}
            {!winnersLoading && !winnersError && recentWinners.length === 0 && (
              <p className="text-text-secondary">No winners found.</p>
            )}
            {recentWinners.map((winner, index) => <motion.div key={winner.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }} className="card-premium overflow-hidden group cursor-pointer">
                <div className="relative h-48 overflow-hidden">
                  <SafeImage src={winner.imageUrl} alt={winner.prize} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-sm text-accent mb-1">
                      {winner.winDate}
                    </div>
                    <div className="text-lg font-bold mb-1">{winner.name}</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-secondary mb-1">
                        Prize Won
                      </div>
                      <div className="font-semibold">{winner.prize}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-secondary mb-1">
                        Value
                      </div>
                      <div className="text-xl font-bold text-accent">
                        {winner.value}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section className="py-16">
        <div className="container-premium">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
            icon: TicketIcon,
            title: '1. Buy Tickets',
            description: 'Choose from our range of premium competitions and purchase your tickets.'
          }, {
            icon: CalendarIcon,
            title: '2. Wait for the Draw',
            description: 'All competitions have a guaranteed end date when a winner will be drawn.'
          }, {
            icon: TrophyIcon,
            title: '3. Win Amazing Prizes',
            description: 'Winners are announced live and contacted immediately to arrange prize delivery.'
          }].map((step, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.2,
            duration: 0.5
          }} className="text-center card-premium p-8 bg-gradient-start border border-gray-800">
                <motion.div initial={{
              scale: 0
            }} whileInView={{
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.2 + 0.3,
              type: 'spring'
            }} className="w-20 h-20 rounded-full bg-gradient-end border-2 border-accent flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-10 h-10 text-accent" />
                </motion.div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>
      {/* Points System */}
      <section className="py-16 premium-gradient">
        <div className="container-premium">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                Earn Points With Every Purchase
              </h2>
              <p className="text-text-secondary mb-6">
                Our loyalty program rewards you with points for every ticket you
                buy. Use your points for discounts on future competitions.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center mr-3 mt-1">
                    <CoinsIcon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <span className="font-medium">Earn 100 points</span> for
                    every £1 spent
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center mr-3 mt-1">
                    <CoinsIcon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <span className="font-medium">Use points</span> for
                    discounts on competitions
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center mr-3 mt-1">
                    <CoinsIcon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <span className="font-medium">Bonus points</span> for
                    referring friends
                  </div>
                </li>
              </ul>
              {/* View Your Points Button */}
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  navigate('/profile/points');
                }}
                className="btn-premium"
              >
                View Your Points
              </button>
            </div>
            <div className="md:w-200">
              <motion.div initial={{
              opacity: 0,
              scale: 0.8
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="bg-gradient-end rounded-2xl p-8 shadow-premium border-2 border-gray-800 relative overflow-hidden">
                <motion.div animate={{
                rotate: 360
              }} transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }} className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full" />
                <motion.div animate={{
                rotate: -360
              }} transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'linear'
              }} className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full" />
                <div className="relative z-10 text-center">
                  <motion.div animate={{
                  y: [0, -10, 0]
                }} transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }} className="mb-6">
                    <CoinsIcon className="w-24 h-24 text-accent mx-auto" />
                  </motion.div>
                  <div className="text-text-secondary mb-2">
                    Start Earning Points
                  </div>
                  <div className="text-5xl font-bold mb-2">Today!</div>
                  <div className="text-sm text-text-secondary mb-6">
                    Join now and get bonus points
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[{
                    label: 'Sign Up',
                    points: '+500'
                  }, {
                    label: 'First Purchase',
                    points: '+1000'
                  }, {
                    label: 'Total Active',
                    points: '+2500'
                  }].map((bonus, index) => <motion.div key={bonus.label} initial={{
                    opacity: 0,
                    y: 20
                  }} whileInView={{
                    opacity: 1,
                    y: 0
                  }} viewport={{
                    once: true
                  }} transition={{
                    delay: index * 0.1
                  }} className="bg-gradient-start rounded-xl p-3">
                        <div className="text-accent font-bold text-lg">
                          {bonus.points}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {bonus.label}
                        </div>
                      </motion.div>)}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>;
}

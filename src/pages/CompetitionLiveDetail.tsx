import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, UsersIcon, ClockIcon, CreditCardIcon, ShoppingCartIcon, PlayIcon } from 'lucide-react';
import { QuestionSection } from '../components/QuestionSection';
import { useNavigate } from 'react-router-dom';
export function CompetitionLiveDetail() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const competition = {
    id: id || '1',
    title: 'Luxury Sports Car Live Draw',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    description: 'Watch the live draw and purchase tickets in real-time!',
    price: 24.99,
    totalTickets: 5000,
    soldTickets: 4200,
    participants: 4200,
    status: 'live' as const
  };
  const handleBuyNow = () => {
    if (!selectedAnswer) {
      alert('Please answer the question first!');
      return;
    }
    navigate('/src/pages/Checkout.tsx');
  };
  const handleAddToCart = () => {
    if (!selectedAnswer) {
      alert('Please answer the question first!');
      return;
    }
    alert('Added to cart!');
  };
  return <div className="py-8">
      <div className="container-premium">
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }}>
          <Link to="/live-draws" className="inline-flex items-center text-accent hover:underline mb-6">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Live Draws
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-premium overflow-hidden">
                <div className="relative">
                  <div className="aspect-video bg-gradient-end flex items-center justify-center">
                    <div className="text-center">
                      <PlayIcon className="w-16 h-16 text-accent mx-auto mb-4" />
                      <div className="text-xl font-bold mb-2">
                        LIVE DRAW IN PROGRESS
                      </div>
                      <div className="text-text-secondary">
                        Watch the excitement unfold
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-red-500 rounded-full px-4 py-2 text-sm font-bold flex items-center animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                    LIVE
                  </div>
                </div>
              </div>
              <div className="card-premium p-6">
                <h1 className="text-3xl font-bold mb-4">{competition.title}</h1>
                <p className="text-text-secondary mb-6">
                  {competition.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="card-premium p-4 bg-gradient-start">
                    <UsersIcon className="w-6 h-6 text-accent mb-2" />
                    <div className="text-sm text-text-secondary mb-1">
                      Participants
                    </div>
                    <div className="text-xl font-bold">
                      {competition.participants}
                    </div>
                  </div>
                  <div className="card-premium p-4 bg-gradient-start">
                    <ClockIcon className="w-6 h-6 text-accent mb-2" />
                    <div className="text-sm text-text-secondary mb-1">
                      Status
                    </div>
                    <div className="text-xl font-bold text-red-400">LIVE</div>
                  </div>
                  <div className="card-premium p-4 bg-gradient-start">
                    <CreditCardIcon className="w-6 h-6 text-accent mb-2" />
                    <div className="text-sm text-text-secondary mb-1">
                      Ticket Price
                    </div>
                    <div className="text-xl font-bold">
                      £{competition.price}
                    </div>
                  </div>
                  <div className="card-premium p-4 bg-gradient-start">
                    <UsersIcon className="w-6 h-6 text-accent mb-2" />
                    <div className="text-sm text-text-secondary mb-1">
                      Tickets Left
                    </div>
                    <div className="text-xl font-bold">
                      {competition.totalTickets - competition.soldTickets}
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-text-secondary">Tickets Sold</span>
                    <span className="font-bold">
                      {Math.round(competition.soldTickets / competition.totalTickets * 100)}
                      %
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gradient-end rounded-full overflow-hidden">
                    <motion.div initial={{
                    width: 0
                  }} animate={{
                    width: `${competition.soldTickets / competition.totalTickets * 100}%`
                  }} transition={{
                    duration: 1,
                    delay: 0.5
                  }} className="h-full bg-accent" />
                  </div>
                </div>
              </div>
              <QuestionSection onAnswerSelected={setSelectedAnswer} selectedAnswer={selectedAnswer} />
            </div>
            <div className="lg:col-span-1">
              <div className="card-premium p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">
                  Purchase Live Tickets
                </h2>
                <div className="mb-6">
                  <label className="text-sm text-text-secondary block mb-2">
                    Number of Tickets
                  </label>
                  <div className="flex items-center justify-between bg-gradient-end rounded-xl p-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-gradient-start hover:bg-accent transition-colors flex items-center justify-center">
                      -
                    </button>
                    <span className="text-2xl font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-gradient-start hover:bg-accent transition-colors flex items-center justify-center">
                      +
                    </button>
                  </div>
                </div>
                <div className="space-y-3 mb-6 p-4 bg-gradient-end rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      Price per ticket
                    </span>
                    <span>£{competition.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Quantity</span>
                    <span>×{quantity}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-700">
                    <span>Total</span>
                    <span>£{(quantity * competition.price).toFixed(2)}</span>
                  </div>
                </div>
                {!selectedAnswer && <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                    ⚠ Please answer the question below to purchase tickets
                  </div>}
                <div className="space-y-3">
                  <Link to="/checkout">
                                                    <motion.button onClick={handleBuyNow} disabled={!selectedAnswer} className="w-full btn-premium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" whileHover={selectedAnswer ? {
                                    scale: 1.02
                                  } : {}} whileTap={selectedAnswer ? {
                                    scale: 0.98
                                  } : {}}>
                                      <CreditCardIcon className="w-5 h-5 mr-2" />
                                      Buy Now
                                    </motion.button>
                                    </Link>
                  <motion.button onClick={handleAddToCart} disabled={!selectedAnswer} className="w-full py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors border border-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" whileHover={selectedAnswer ? {
                  scale: 1.02
                } : {}} whileTap={selectedAnswer ? {
                  scale: 0.98
                } : {}}>
                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                    Add to Cart
                  </motion.button>
                </div>
                <div className="mt-6 p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                  <div className="text-red-400 font-bold mb-2">
                    ⚡ Live Draw Active!
                  </div>
                  <div className="text-sm text-text-secondary">
                    Purchase tickets now and watch the draw live. Winner will be
                    announced shortly!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>;
}
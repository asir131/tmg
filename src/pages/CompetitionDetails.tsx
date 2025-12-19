import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ClockIcon,
  TicketIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CountdownTimer } from "../components/CountdownTimer";
import { QuestionSection } from "../components/QuestionSection";
import { SafeImage } from "../components/SafeImage";
import { SinglePurchaseModal } from "../components/SinglePurchaseModal";
import { CompetitionImageGallery } from "../components/CompetitionImageGallery";
import { useGetCompetitionByIdQuery } from "../store/api/competitionsApi";
import { useAddToCartMutation } from "../store/api/cartApi";
import { useGetCompetitionFAQsQuery } from "../store/api/faqApi";
import { useGetPostalEntryQuery } from "../store/api/postalEntryApi";
import { useGetTermsQuery } from "../store/api/termsApi";
import { isCompetitionBlocked, addBlockedCompetition } from "../utils/blockedCompetitions";

export function CompetitionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<"online" | "postal">("online");
  const [showPostalModal, setShowPostalModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const {
    data,
    error,
    isLoading: isCompetitionLoading,
  } = useGetCompetitionByIdQuery(id || "");
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const {
    data: faqItems,
    isLoading: isFaqsLoading,
    error: faqsError,
  } = useGetCompetitionFAQsQuery(id || "", {
    skip: !id,
  });
  const {
    data: postalEntry,
    isLoading: isPostalLoading,
    error: postalError,
  } = useGetPostalEntryQuery(id || "", {
    skip: !id,
  });
  
  // Check if postal error is 404 (not found) - this means no postal entry exists
  // RTK Query errors have a 'status' property for HTTP errors
  const isPostalNotFound = postalError && 
    typeof postalError === 'object' && 
    'status' in postalError && 
    postalError.status === 404;
  const {
    data: termsSections,
    isLoading: isTermsLoading,
    error: termsError,
  } = useGetTermsQuery();

  const competition = data?.data.competition;

  const isAuthenticated = !!localStorage.getItem("accessToken");

  // Check if competition is blocked
  useEffect(() => {
    if (competition?._id) {
      setIsBlocked(isCompetitionBlocked(competition._id));
    }
  }, [competition?._id]);

  // Helper function to check if error is a wrong answer error
  const isWrongAnswerError = (error: any): boolean => {
    return (
      error?.data?.code === 'WRONG_ANSWER' ||
      error?.data?.code === 'INCORRECT_ANSWER' ||
      error?.data?.message?.toLowerCase().includes('incorrect answer') ||
      error?.data?.message?.toLowerCase().includes('wrong answer') ||
      (error?.status === 403 && error?.data?.message?.toLowerCase().includes('answer'))
    );
  };

  if (isCompetitionLoading) {
    return (
      <div className="container-premium py-8 text-center">
        Loading competition details...
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="container-premium py-8 text-center text-red-500">
        Error loading competition or competition not found.
      </div>
    );
  }

  const subtotal = quantity * competition.ticket_price;
  const total = subtotal;
  const progressPercentage = Math.min(
    Math.round((competition.tickets_sold / competition.max_tickets) * 100),
    100
  );

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedAnswer) {
      toast.error("Please select an answer before purchasing tickets.");
      return;
    }
    if (isBlocked) {
      toast.error("You are blocked from purchasing tickets for this competition.");
      return;
    }
    setShowPurchaseModal(true);
  };

  const handleAddToCart = async () => {
    setApiError(null);
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedAnswer) {
      toast.error("Please select an answer before adding to cart.");
      return;
    }
    if (isBlocked) {
      toast.error("You are blocked from purchasing tickets for this competition.");
      return;
    }
    try {
      await addToCart({
        competition_id: competition._id,
        quantity,
        answer: selectedAnswer,
      }).unwrap();
      toast.success("Added to cart.");
    } catch (err: any) {
      console.error("Failed to add to cart:", err);
      
      // Check if error is due to wrong answer
      if (isWrongAnswerError(err)) {
        addBlockedCompetition(competition._id);
        setIsBlocked(true);
        const errorMessage = "Incorrect answer. You are now permanently blocked from purchasing tickets for this competition.";
        setApiError(errorMessage);
        toast.error(errorMessage);
      } else if (err.data && err.data.message) {
        setApiError(err.data.message);
        toast.error(err.data.message);
      } else {
        toast.error("Failed to add to cart. Please try again.");
      }
    }
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div className="py-8">
      <ToastContainer position="top-right" />
      {/* Hero Section with Gallery */}
      <div className="container-premium mb-8">
        <CompetitionImageGallery competition={competition} />
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
          className="mt-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {competition.title}
          </h1>
          <p className="text-xl text-text-secondary mb-6 max-w-3xl">
            {competition.short_description}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-sm text-text-secondary mb-1">
                Ticket Price
              </div>
              <div className="text-3xl font-bold">
                £{competition.ticket_price.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-secondary mb-1">
                Cash Alternative
              </div>
              <div className="text-3xl font-bold">
                £{competition.cash_alternative.toLocaleString()}
              </div>
            </div>
            <div className="ml-auto">
              <CountdownTimer
                endDate={new Date(competition.draw_countdown)}
              />
            </div>
          </div>
        </motion.div>
      </div>
      <div className="container-premium">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            className="lg:col-span-2"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: TicketIcon,
                  label: "Total Tickets",
                  value: competition.max_tickets.toLocaleString(),
                },
                {
                  icon: UsersIcon,
                  label: "Tickets Sold",
                  value: competition.tickets_sold.toLocaleString(),
                },
                {
                  icon: TrophyIcon,
                  label: "Cash Alternative",
                  value: `£${competition.cash_alternative.toLocaleString()}`,
                },
                {
                  icon: ClockIcon,
                  label: "Draw Date",
                  value: new Date(competition.draw_time).toLocaleDateString(),
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.4 + index * 0.1,
                  }}
                  className="card-premium p-4"
                >
                  <stat.icon className="w-6 h-6 text-accent mb-2" />
                  <div className="text-sm text-text-secondary mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xl font-bold">{stat.value}</div>
                </motion.div>
              ))}
            </div>
            {/* Progress Bar */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.8,
              }}
              className="card-premium p-6 mb-8"
            >
              <div className="flex justify-between mb-2">
                <span className="text-text-secondary">
                  Competition Progress
                </span>
                <span className="font-bold">{progressPercentage}% Sold</span>
              </div>
              <div className="w-full h-3 bg-gradient-end rounded-full overflow-hidden">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${progressPercentage}%`,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.9,
                  }}
                  className="h-full bg-accent"
                />
              </div>
              <div className="text-sm text-text-secondary mt-2">
                {competition.max_tickets - competition.tickets_sold} tickets
                remaining
              </div>
            </motion.div>
            {/* Entry Type Tabs */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.9,
              }}
              className="card-premium mb-8"
            >
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setEntryType("online")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
                    entryType === "online"
                      ? "text-white"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  Online Entry
                  {entryType === "online" && (
                    <motion.div
                      layoutId="entryType"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEntryType("postal");
                    if (postalEntry) {
                      setShowPostalModal(true);
                    } else if (!isPostalLoading && !isPostalNotFound && postalError) {
                      toast.error("Failed to load postal entry instructions.");
                    }
                  }}
                  disabled={!postalEntry && !isPostalLoading && !isPostalNotFound}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
                    entryType === "postal"
                      ? "text-white"
                      : "text-text-secondary hover:text-white"
                  } ${!postalEntry && !isPostalLoading && !isPostalNotFound ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Postal Entry
                  {entryType === "postal" && (
                    <motion.div
                      layoutId="entryType"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              </div>
            </motion.div>
            {/* Tabs */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 1,
              }}
              className="card-premium"
            >
              <div className="flex border-b border-gray-700">
                {["details", "faqs", "terms"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-medium capitalize transition-all relative ${
                      activeTab === tab
                        ? "text-white"
                        : "text-text-secondary hover:text-white"
                    }`}
                  >
                    {tab === "faqs" ? "FAQs" : tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === "details" && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: competition.long_description,
                    }}
                  />
                )}
                {activeTab === "faqs" && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="space-y-4"
                  >
                    {isFaqsLoading && (
                      <p className="text-text-secondary">Loading FAQs...</p>
                    )}
                    {faqsError && (
                      <p className="text-red-500">Failed to load FAQs.</p>
                    )}
                    {faqItems?.map((faq) => (
                      <div key={faq._id} className="card-premium p-4">
                        <h3 className="font-semibold mb-2">{faq.question}</h3>
                        <p className="text-text-secondary">{faq.answer}</p>
                      </div>
                    ))}
                    {faqItems &&
                      faqItems.length === 0 &&
                      !isFaqsLoading &&
                      !faqsError && (
                        <p className="text-text-secondary">
                          No FAQs available.
                        </p>
                      )}
                  </motion.div>
                )}
                {activeTab === "terms" && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="prose prose-invert max-w-none space-y-4"
                  >
                    {isTermsLoading && (
                      <p className="text-text-secondary">
                        Loading terms & conditions...
                      </p>
                    )}
                    {termsError && (
                      <p className="text-red-500">
                        Failed to load terms & conditions.
                      </p>
                    )}
                    {termsSections?.map((section, index) => (
                      <div key={section.id || index} className="card-premium p-4">
                        <h3 className="font-semibold mb-2">
                          {index + 1}. {section.title}
                        </h3>
                        <p className="text-text-secondary whitespace-pre-line">
                          {section.content}
                        </p>
                      </div>
                    ))}
                    {termsSections &&
                      termsSections.length === 0 &&
                      !isTermsLoading &&
                      !termsError && (
                        <p className="text-text-secondary">
                          No terms available.
                        </p>
                      )}
                  </motion.div>
                )}
              </div>
            </motion.div>
            {/* Related Competitions */}
            {/* Removed related competitions for now as there is no API endpoint for them */}
          </motion.div>
          {/* Sidebar - Purchase Section */}
          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.4,
            }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {!isBlocked && (
                <QuestionSection
                  onAnswerSelected={setSelectedAnswer}
                  selectedAnswer={selectedAnswer}
                />
              )}
              {isBlocked && (
                <div className="card-premium p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4 text-red-400">Answer to Enter</h3>
                  <p className="text-text-secondary">
                    You are blocked from purchasing tickets for this competition due to an incorrect answer.
                  </p>
                </div>
              )}
              <div className="card-premium p-6">
                <h2 className="text-xl font-bold mb-6">Purchase Tickets</h2>
                <div className="mb-6">
                  <label className="text-sm text-text-secondary block mb-2">
                    Number of Tickets
                  </label>
                  <div className="flex items-center justify-between bg-gradient-end rounded-xl p-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-gradient-start hover:bg-accent transition-colors flex items-center justify-center"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold">{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(competition.max_per_person, quantity + 1)
                        )
                      }
                      className="w-10 h-10 rounded-lg bg-gradient-start hover:bg-accent transition-colors flex items-center justify-center"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-xs text-text-secondary mt-1 text-center">
                    Max {competition.max_per_person} tickets per person
                  </div>
                </div>
                {/* Quick Select Card */}
                <div className="mb-6">
                  <label className="text-sm text-text-secondary block mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[20, 50, 80, 100].map((ticketCount) => {
                      const isDisabled = ticketCount > competition.max_per_person;
                      const isSelected = quantity === ticketCount;
                      return (
                        <button
                          key={ticketCount}
                          onClick={() => {
                            if (!isDisabled) {
                              setQuantity(Math.min(ticketCount, competition.max_per_person));
                            }
                          }}
                          disabled={isDisabled}
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-accent text-white'
                              : isDisabled
                              ? 'bg-gradient-end text-text-secondary opacity-50 cursor-not-allowed'
                              : 'bg-gradient-end hover:bg-gray-700 text-white border border-gray-700'
                          }`}
                        >
                          {ticketCount}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3 mb-6 p-4 bg-gradient-end rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      Price per ticket
                    </span>
                    <span>£{competition.ticket_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Quantity</span>
                    <span>×{quantity}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mt-3">
                      <span>Total</span>
                      <span>£{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {isBlocked && (
                  <div className="mb-4 p-3 bg-red-500/20 rounded-lg text-red-400 text-sm border border-red-500/30">
                    ⚠️ You are blocked from purchasing tickets for this competition due to an incorrect answer.
                  </div>
                )}
                {!selectedAnswer && !isBlocked && (
                  <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                    ⚠️ Please answer the question above to purchase tickets
                  </div>
                )}
                <div className="space-y-3">
                  <motion.button
                    onClick={handleBuyNow}
                    disabled={!selectedAnswer || isBlocked}
                    className="w-full btn-premium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={
                      selectedAnswer
                        ? {
                            scale: 1.02,
                          }
                        : {}
                    }
                    whileTap={
                      selectedAnswer
                        ? {
                            scale: 0.98,
                          }
                        : {}
                    }
                  >
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    Buy Now
                  </motion.button>

                  <motion.button
                    onClick={handleAddToCart}
                    disabled={!selectedAnswer || isAddingToCart || isBlocked}
                    className="w-full py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors border border-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={
                      selectedAnswer && !isAddingToCart ? { scale: 1.02 } : {}
                    }
                    whileTap={
                      selectedAnswer && !isAddingToCart ? { scale: 0.98 } : {}
                    }
                  >
                    {isAddingToCart ? (
                      "Adding..."
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                  {apiError && (
                    <div className="mt-4 text-center text-red-500">
                      <p>{apiError}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-xs text-text-secondary text-center">
                  By purchasing, you agree to our{" "}
                  <a
                    href="/terms-and-conditions"
                    className="text-accent hover:underline"
                  >
                    Terms & Conditions
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Postal Entry Modal */}
      <AnimatePresence>
        {showPostalModal && postalEntry && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() => setShowPostalModal(false)}
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              onClick={(e) => e.stopPropagation()}
              className="card-premium p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">
                {postalEntry.title}
              </h2>
              
              {/* Instructions */}
              <div className="space-y-4 text-text-secondary mb-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">Instructions</h3>
                  <div 
                    className="whitespace-pre-line"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {postalEntry.instructions}
                  </div>
                </div>

                {/* Postal Address */}
                <div>
                  <h3 className="font-semibold text-white mb-2">Postal Address</h3>
                  <address 
                    className="whitespace-pre-line not-italic"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {postalEntry.postal_address}
                  </address>
                </div>

                {/* Deadline */}
                <div>
                  <h3 className="font-semibold text-white mb-2">Deadline</h3>
                  <p className={`${new Date(postalEntry.deadline) < new Date() ? 'text-red-400' : ''}`}>
                    {formatDate(postalEntry.deadline)}
                  </p>
                  {new Date(postalEntry.deadline) < new Date() && (
                    <p className="text-red-400 text-sm mt-1">⚠️ Deadline has passed</p>
                  )}
                </div>

                {/* Entry Fee */}
                <div>
                  <h3 className="font-semibold text-white mb-2">Entry Fee</h3>
                  <p className="text-lg font-semibold">
                    {formatCurrency(postalEntry.entry_fee)}
                  </p>
                </div>
              </div>

              <div className="text-center mb-6">
                <Link
                  to="/terms-and-conditions"
                  className="text-accent hover:underline font-medium"
                  onClick={() => setShowPostalModal(false)}
                >
                  For full terms and conditions click here
                </Link>
              </div>
              <button
                onClick={() => setShowPostalModal(false)}
                className="w-full btn-premium"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Single Purchase Modal */}
      <SinglePurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        competitionId={competition._id}
        quantity={quantity}
        ticketPrice={competition.ticket_price}
        competitionTitle={competition.title}
        answer={selectedAnswer || ""}
        onBlocked={() => setIsBlocked(true)}
      />
    </div>
  );
}

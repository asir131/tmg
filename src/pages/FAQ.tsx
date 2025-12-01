import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";
import { useGetFaqsQuery } from "../store/api/faqApi";

export function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const { data: faqs, isLoading, error } = useGetFaqsQuery();

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="py-8">
      <div className="container-premium max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-center">
            Frequently Asked Questions
          </h1>
          <p className="text-text-secondary text-center mb-8">
            Find answers to common questions about our competitions
          </p>
          {isLoading && (
            <p className="text-text-secondary text-center">Loading FAQs...</p>
          )}
          {error && (
            <p className="text-red-500 text-center">Failed to load FAQs.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {faqs?.map((faq, index) => (
            <motion.div
              key={faq._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-premium overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDownIcon className="w-5 h-5 text-accent flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openItems.includes(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-text-secondary">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {faqs && faqs.length === 0 && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-text-secondary">No FAQs found.</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 card-premium p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-text-secondary mb-6">
            Can't find what you're looking for? Our support team is here to
            help.
          </p>
          <button className="btn-premium">Contact Support</button>
        </motion.div>
      </div>
    </div>
  );
}

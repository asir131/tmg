import { motion } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetTermsQuery } from "../store/api/termsApi";

export function TermsAndConditions() {
  const navigate = useNavigate();
  const { data: sections, isLoading, error } = useGetTermsQuery();

  return (
    <div className="py-8">
      <div className="container-premium max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-accent hover:underline mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="card-premium p-8">
            <h1 className="text-4xl font-bold mb-6">Terms & Conditions</h1>

            {isLoading && (
              <p className="text-text-secondary mb-4">Loading terms...</p>
            )}
            {error && (
              <p className="text-red-500 mb-4">Failed to load terms.</p>
            )}

            <div className="prose prose-invert max-w-none space-y-6">
              {sections?.map((section, idx) => (
                <section key={section.id}>
                  <h2 className="text-2xl font-bold mb-4">
                    {idx + 1}. {section.title}
                  </h2>
                  <p className="text-text-secondary mb-4">
                    {section.content}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

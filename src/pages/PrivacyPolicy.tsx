import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export function PrivacyPolicy() {
  const navigate = useNavigate(); // Must be inside component

  return (
    <div className="py-8">
      <div className="container-premium max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-accent hover:underline mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="card-premium p-8">
            <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
            <div className="text-sm text-text-secondary mb-8">
              Last updated: January 2024
            </div>

            <div className="prose prose-invert max-w-none space-y-6">
              {/* ----------------------------- */}
              {/* All sections unchanged */}
              {/* ----------------------------- */}

              <section>
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-text-secondary">
                  CompetitionHub ("we", "our", "us") is committed to protecting
                  your privacy. This Privacy Policy explains how we collect,
                  use, disclose, and safeguard your information when you visit
                  our website and participate in our competitions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
                <p className="text-text-secondary mb-4">
                  We collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary mb-4">
                  <li>Register for an account</li>
                  <li>Enter a competition</li>
                  <li>Make a purchase</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Contact customer support</li>
                </ul>
                <p className="text-text-secondary mb-4">This information may include:</p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Postal address</li>
                  <li>Payment information</li>
                  <li>Date of birth</li>
                </ul>
              </section>

              {/* The rest of the sections remain unchanged */}
              {/* 3. How We Use Your Information */}
              {/* 4. Cookies and Tracking Technologies */}
              {/* 5. Information Sharing */}
              {/* 6. Data Security */}
              {/* 7. Your Rights */}
              {/* 8. Data Retention */}
              {/* 9. Children's Privacy */}
              {/* 10. Changes to This Policy */}
              {/* 11. Contact Us */}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

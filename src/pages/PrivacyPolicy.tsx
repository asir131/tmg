import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useGetPrivacyPolicyQuery } from "../store/api/privacyApi";
import { useMemo } from "react";

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const {
    data: privacyPolicy,
    isLoading,
    error,
    refetch,
  } = useGetPrivacyPolicyQuery();

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  // Format content: split by double newlines, preserve numbered sections, format lists
  const formattedContent = useMemo(() => {
    if (!privacyPolicy?.content) return null;

    const content = privacyPolicy.content;
    
    // Split by double newlines to create paragraphs
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    
    return paragraphs
      .map((paragraph) => paragraph.trim())
      .filter((trimmed) => trimmed.length > 0)
      .map((trimmed, index) => {
      
      // Check if it's a numbered section heading (e.g., "1. Overview")
      const sectionMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (sectionMatch) {
        return {
          type: 'heading',
          level: 2,
          text: trimmed,
          number: sectionMatch[1],
          title: sectionMatch[2],
        };
      }
      
      // Check if it's a subsection (e.g., "a) Details You Give Us Directly")
      const subsectionMatch = trimmed.match(/^([a-z])\)\s+(.+)$/i);
      if (subsectionMatch) {
        return {
          type: 'heading',
          level: 3,
          text: trimmed,
          title: subsectionMatch[2],
        };
      }
      
      // Check if paragraph contains multiple lines that look like list items
      const lines = trimmed.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        // Check if all lines start with list markers
        const allListItems = lines.every(line => 
          line.match(/^[-•·]\s/) || 
          line.match(/^[a-z]\)\s/i) ||
          line.match(/^\d+[\.\)]\s/)
        );
        
        if (allListItems) {
          return {
            type: 'list',
            items: lines.map(line => line.replace(/^[-•·]\s*/, '').replace(/^[a-z0-9]+[\.\)]\s*/i, '').trim()),
          };
        }
      }
      
      // Check if it's a single list item (starts with "-" or bullet)
      if (trimmed.match(/^[-•·]\s/)) {
        return {
          type: 'list',
          items: [trimmed.replace(/^[-•·]\s*/, '').trim()],
        };
      }
      
      // Regular paragraph
      return {
        type: 'paragraph',
        text: trimmed,
      };
    });
  }, [privacyPolicy?.content]);

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
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
                <p className="text-text-secondary">Loading Privacy Policy...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                <p className="text-red-400 mb-2">
                  Failed to load Privacy Policy.
                </p>
                <p className="text-sm text-text-secondary mb-3">
                  {(error as any)?.data?.message ||
                    (error as any)?.error ||
                    "Unable to fetch Privacy Policy content."}
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Content */}
            {!isLoading && !error && privacyPolicy && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl font-bold mb-6">
                  {privacyPolicy.title || "Privacy Policy"}
                </h1>
                
                {privacyPolicy.updatedAt && (
                  <div className="text-sm text-text-secondary mb-8">
                    Last updated: {formatDate(privacyPolicy.updatedAt) || "Recently"}
                  </div>
                )}

                <div className="prose prose-invert max-w-none space-y-6">
                  {formattedContent?.map((item, index) => {
                    if (item.type === 'heading') {
                      const HeadingTag = item.level === 2 ? 'h2' : 'h3';
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <HeadingTag className={`font-bold mb-4 ${item.level === 2 ? 'text-2xl mt-8' : 'text-xl mt-6'}`}>
                            {item.text}
                          </HeadingTag>
                        </motion.div>
                      );
                    }
                    
                    if (item.type === 'list') {
                      return (
                        <motion.ul
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="list-disc list-inside space-y-2 text-text-secondary ml-4"
                        >
                          {item.items.map((listItem, listIndex) => (
                            <li key={listIndex}>{listItem}</li>
                          ))}
                        </motion.ul>
                      );
                    }
                    
                    return (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="text-text-secondary leading-relaxed"
                      >
                        {item.text}
                      </motion.p>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && !error && privacyPolicy && !privacyPolicy.content && (
              <div className="text-center py-12">
                <p className="text-text-secondary">
                  No Privacy Policy content available at this time.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

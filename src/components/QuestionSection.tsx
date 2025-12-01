import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "lucide-react";
interface QuestionSectionProps {
  onAnswerSelected: (answer: string) => void;
  selectedAnswer: string | null;
}
export function QuestionSection({
  onAnswerSelected,
  selectedAnswer,
}: QuestionSectionProps) {
  const question = "What car manufacturer produces the GOLF?";
  const options = ["Suzuki", "Volkswagen", "Mercedes", "Toyota"];
  const correctAnswer = "Volkswagen";
  return (
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
        duration: 0.5,
      }}
      className="card-premium p-6 mb-6"
    >
      <h3 className="text-xl font-bold mb-4">Answer to Enter</h3>
      <p className="text-text-secondary mb-6">{question}</p>
      <div className="space-y-3">
        {options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => onAnswerSelected(option)}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              selectedAnswer === option
                ? "bg-accent text-white border-2 border-accent"
                : "bg-gradient-end hover:bg-gray-700 border-2 border-transparent"
            }`}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{option}</span>
              {selectedAnswer === option && (
                <motion.div
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                  }}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      {selectedAnswer && (
        <motion.div
          initial={{
            opacity: 0,
            height: 0,
          }}
          animate={{
            opacity: 1,
            height: "auto",
          }}
          className="mt-4 p-3 bg-green-500/20 rounded-lg text-green-400 text-sm"
        >
          ✓ Answer submitted! You can now purchase tickets.
        </motion.div>
      )}
    </motion.div>
  );
}

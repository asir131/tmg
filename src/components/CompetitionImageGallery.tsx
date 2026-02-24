import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { Competition } from '../store/types';

interface CompetitionImageGalleryProps {
  competition: Competition;
}

export function CompetitionImageGallery({ competition }: CompetitionImageGalleryProps) {
  // Use featured image as primary, and gallery images as additional
  // According to API: image_url is featured, image_gallery is array of additional images
  const featuredImage = competition.image_url;
  const galleryImages = competition.image_gallery || [];
  
  // If there's a featured image, show it first, then gallery images
  // If no featured image but gallery exists, use gallery images
  const allImages = featuredImage 
    ? [featuredImage, ...galleryImages]
    : galleryImages;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close fullscreen on Escape; arrow keys to navigate in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (isFullscreen && allImages.length > 1) {
        if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length);
        if (e.key === 'ArrowRight') setCurrentIndex((i) => (i + 1) % allImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, allImages.length]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  if (allImages.length === 0) {
    return (
      <div className="relative h-[500px] mb-8 rounded-2xl overflow-hidden bg-gradient-end flex items-center justify-center">
        <p className="text-text-secondary">No images available</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const openFullscreen = (index?: number) => {
    if (index !== undefined) setCurrentIndex(index);
    setIsFullscreen(true);
  };

  return (
    <div className="relative mb-8">
      {/* Main Image Carousel */}
      <div
        className="relative h-[500px] rounded-2xl overflow-hidden cursor-zoom-in"
        onClick={() => openFullscreen()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openFullscreen()}
        aria-label="View image full screen"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <SafeImage
              src={allImages[currentIndex]}
              alt={`${competition.title} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all z-10"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all z-10"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}

        {/* Gradient Overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
      </div>

      {/* Thumbnail Navigation */}
      {allImages.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => openFullscreen(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-zoom-in ${
                index === currentIndex
                  ? 'border-accent ring-2 ring-accent/50'
                  : 'border-gray-700 hover:border-gray-600 opacity-70 hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1} full screen`}
            >
              <SafeImage
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {isFullscreen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFullscreen(false)}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            >
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-[60] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close full screen"
              >
                <XIcon className="w-6 h-6 text-white" />
              </button>

              <div
                className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-full max-h-[90vh]"
                >
                  <SafeImage
                    src={allImages[currentIndex]}
                    alt={`${competition.title} - Image ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                  />
                </motion.div>

                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((i) => (i + 1) % allImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="w-6 h-6 text-white" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm">
                      {currentIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


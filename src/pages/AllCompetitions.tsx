import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, GridIcon, ListIcon } from 'lucide-react';
import { CompetitionCard } from '../components/CompetitionCard';
import { useGetCompetitionsQuery, useGetCategoriesQuery } from '../store/api/competitionsApi';

export function AllCompetitions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const selectedCategorySlug = selectedCategory === 'all' ? undefined : selectedCategory;
  const { data: competitionsData, error, isLoading } = useGetCompetitionsQuery({
    page,
    limit: 10,
    category_slug: selectedCategorySlug,
    status: 'active',
  });
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery();
  const competitions = competitionsData?.data.competitions ?? [];
  const categories = categoriesData ?? [];
  const filteredCompetitions = competitions.filter((competition) => {
    const matchesSearch = (() => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        competition.title.toLowerCase().includes(query) ||
        competition.short_description?.toLowerCase().includes(query)
      );
    })();

    return matchesSearch;
  });
  
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const totalPages = competitionsData?.data.pagination.totalPages || 1;

  return <div className="py-8">
      <div className="container-premium">
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }}>
          <h1 className="text-4xl font-bold mb-8">All Competitions</h1>
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-grow relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input type="text" placeholder="Search competitions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors" />
            </div>
            <div className="flex gap-4">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={categoriesLoading} className="px-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors">
                <option value="all">All Categories</option>
                {categories.map(category => <option key={category._id} value={category.slug}>
                    {category.name}
                  </option>)}
                {categoriesError && <option value="__error">Categories unavailable</option>}
              </select>
              <div className="flex gap-2 bg-gradient-end rounded-xl p-1 border border-gray-700">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-accent' : 'hover:bg-gray-700'}`}>
                  <GridIcon className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-accent' : 'hover:bg-gray-700'}`}>
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Competitions Grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
          {isLoading && <p>Loading competitions...</p>}
          {error && <p>Error fetching competitions.</p>}
          {filteredCompetitions.length === 0 && !isLoading && !error && (
            <p className="text-text-secondary">No competitions match your search.</p>
          )}
          {filteredCompetitions.map((competition, index) => <motion.div key={competition._id} variants={itemVariants}>
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
            </motion.div>)}
        </motion.div>
        {/* Pagination */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.5
      }} className="flex justify-center mt-12 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => <button key={pageNumber} onClick={() => setPage(pageNumber)} className={`w-10 h-10 rounded-lg ${pageNumber === page ? 'bg-accent text-white' : 'bg-gradient-end hover:bg-gray-700'} transition-colors`}>
              {pageNumber}
            </button>)}
        </motion.div>
      </div>
    </div>;
}

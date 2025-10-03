import React, { createContext, useContext, useEffect, useState } from "react";
import API_BASE from "../utils/apiBase";

const LandingPageCardsContext = createContext();

export const useLandingPageCards = () => {
  const context = useContext(LandingPageCardsContext);
  if (!context) {
    throw new Error(
      "useLandingPageCards must be used within a LandingPageCardsProvider",
    );
  }
  return context;
};

export const LandingPageCardsProvider = ({ children }) => {
  const [cards, setCards] = useState({
    categories: [],
    skills: [],
    features: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const CACHE_KEY = "landingPageCards";
  const CACHE_TIMESTAMP_KEY = "landingPageCardsTimestamp";
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  const loadCardsFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all sections in parallel
      const [categoriesRes, skillsRes, featuresRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/landing-page-cards?section=categories`),
        fetch(`${API_BASE}/api/admin/landing-page-cards?section=skills`),
        fetch(`${API_BASE}/api/admin/landing-page-cards?section=features`),
      ]);

      const [categoriesData, skillsData, featuresData] = await Promise.all([
        categoriesRes.json(),
        skillsRes.json(),
        featuresRes.json(),
      ]);

      const newCards = {
        categories: categoriesData.cards || [],
        skills: skillsData.cards || [],
        features: featuresData.cards || [],
      };

      // Cache the data
      const cacheData = {
        data: newCards,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCards(newCards);
    } catch (err) {
      console.error("Failed to load landing page cards:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCardsFromCache = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cached && timestamp) {
        const cacheData = JSON.parse(cached);
        const cacheTime = parseInt(timestamp);

        // Check if cache is still valid
        if (Date.now() - cacheTime < CACHE_DURATION) {
          setCards(cacheData.data || cacheData); // Handle both old and new cache formats
          setLoading(false);
          return true;
        }
      }
    } catch (err) {
      console.error("Error loading from cache:", err);
    }
    return false;
  };

  const refreshCards = () => {
    // Clear cache and reload
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
    loadCardsFromAPI();
  };

  useEffect(() => {
    // Try to load from cache first
    if (!loadCardsFromCache()) {
      // If no valid cache, load from API
      loadCardsFromAPI();
    }
  }, []);

  const value = {
    cards,
    loading,
    error,
    refreshCards,
  };

  return (
    <LandingPageCardsContext.Provider value={value}>
      {children}
    </LandingPageCardsContext.Provider>
  );
};

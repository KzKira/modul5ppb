import { useState, useEffect, useCallback } from 'react';
import favoriteService from '../services/favoriteService';
import userService from '../services/userService';

/**
 * Get user identifier from localStorage or generate new one
 */
const getUserIdentifier = () => {
  return userService.getUserIdentifier();
};

/**
 * Custom hook for fetching favorites
 * @returns {Object} - { favorites, loading, error, refetch }
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userIdentifier = getUserIdentifier();

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await favoriteService.getFavorites(userIdentifier);
      
      if (response.success) {
        setFavorites(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [userIdentifier]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    refetch: fetchFavorites,
  };
}

/**
 * Custom hook for toggling favorites
 * @returns {Object} - { toggleFavorite, loading, error }
 */
export function useToggleFavorite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userIdentifier = getUserIdentifier();

  const toggleFavorite = async (recipeId) => {
    try {
      setLoading(true);
      setError(null);
      // Try server toggle first
      try {
        const response = await favoriteService.toggleFavorite({
          recipe_id: recipeId,
          user_identifier: userIdentifier,
        });

        if (response && response.success) {
          // if server returns boolean or data, try to normalize to boolean
          if (typeof response.data === 'boolean') {
            // update localStorage to keep fallback in sync
            try {
              const raw = JSON.parse(localStorage.getItem('favorites') || '[]');
              const idx = raw.indexOf(recipeId);
              if (response.data && idx === -1) raw.push(recipeId);
              if (!response.data && idx > -1) raw.splice(idx, 1);
              localStorage.setItem('favorites', JSON.stringify(raw));
            } catch (e) {
              // ignore
            }
            return response.data;
          }

          // If server returned an array of favorites or an object, try to sync localStorage
          try {
            if (Array.isArray(response.data)) {
              const ids = response.data.map(d => (typeof d === 'object' ? d.id || d.recipe_id || d.recipeId : d));
              localStorage.setItem('favorites', JSON.stringify(ids));
            }
          } catch (e) {
            // ignore
          }

          return true;
        }
      } catch (e) {
        // server toggle failed; we'll fall back to localStorage below
        console.warn('Server toggle failed, falling back to localStorage', e);
      }

      // Fallback: toggle in localStorage for offline/local mode
      try {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const index = favorites.indexOf(recipeId);
        let newState = false;
        if (index > -1) {
          favorites.splice(index, 1);
          newState = false;
        } else {
          favorites.push(recipeId);
          newState = true;
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        return newState;
      } catch (e) {
        setError('Failed to toggle favorite locally');
        return null;
      }
    } catch (err) {
      setError(err.message || 'An error occurred while toggling favorite');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    toggleFavorite,
    loading,
    error,
  };
}

/**
 * Custom hook to check if a recipe is favorited
 * @param {string} recipeId - Recipe ID
 * @returns {Object} - { isFavorited, loading, toggleFavorite }
 */
export function useIsFavorited(recipeId) {
  const { favorites, loading: fetchLoading, refetch } = useFavorites();
  const { toggleFavorite: toggle, loading: toggleLoading } = useToggleFavorite();
  
  const isFavorited = favorites.some(fav => fav.id === recipeId);

  const toggleFavorite = async () => {
    const result = await toggle(recipeId);
    if (result) {
      await refetch();
    }
    return result;
  };

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  };
}

export { getUserIdentifier };
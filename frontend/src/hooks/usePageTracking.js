import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export const usePageTracking = (pageName) => {
  const { user } = useUser();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        await fetch(`${API_URL}/api/analytics/pageview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pageName,
            user_id: user?.id || 'anonymous',
          }),
        });
      } catch (error) {
        console.error('Failed to track pageview:', error);
      }
    };

    trackPageView();
  }, [pageName, user?.id]);
};

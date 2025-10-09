import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export const usePageTracking = (pageName) => {
  const { user } = useUser();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('http://localhost:8001/api/analytics/pageview', {
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

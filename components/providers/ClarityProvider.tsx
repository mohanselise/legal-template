'use client';

/**
 * ClarityProvider Component
 * 
 * Initializes Microsoft Clarity analytics on the client side.
 * Since no cookie consent is required, Clarity is initialized immediately.
 */

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initClarity, identifyUser } from '@/lib/analytics/clarity';

interface ClarityProviderProps {
  children: React.ReactNode;
}

export function ClarityProvider({ children }: ClarityProviderProps) {
  const { user, isLoaded } = useUser();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    // Only initialize if project ID is provided
    if (!projectId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Clarity] NEXT_PUBLIC_CLARITY_PROJECT_ID is not set. Clarity will not be initialized.');
      }
      return;
    }

    // Initialize Clarity
    initClarity(projectId);

    // Identify user if authenticated
    if (isLoaded && user) {
      // Use Clerk user ID as custom ID
      // Clarity securely hashes the customId on the client before sending
      identifyUser(
        user.id,
        undefined, // customSessionId - let Clarity handle session tracking
        undefined, // customPageId - let Clarity handle page tracking
        user.fullName || user.emailAddresses[0]?.emailAddress || undefined // friendlyName
      );
    }
  }, [projectId, user, isLoaded]);

  return <>{children}</>;
}

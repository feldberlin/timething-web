// @ts-expect-error keep react here
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { useAuth } from '../components/hooks/useAuth.tsx';
import supabase from '../supabaseClient.ts';
import customTheme from '../authCustomTheme.ts';
import authChangeEvents from '../authChangeEvents.ts';

// images
import logoUrl from '../../voicelayer.svg';

// styles
import '../../css/pages/HomePage.css';

/**
 * Main page users land on when they visit the site.
 *
 */
export default function HomePage() {
  const { session, user, authChangeEvent } = useAuth();
  const navigate = useNavigate();

  const isSignedIn = session && user
    && (authChangeEvent === authChangeEvents.SIGNED_IN
      || authChangeEvent === authChangeEvents.INITIAL_SESSION);

  useEffect(() => {
    if (isSignedIn) {
      navigate('/upload');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-w-full min-h-screen screen">
      <div className="w-full h-screen flex">
        <main className="w-full flex flex-col items-start gap-3 pt-6 overflow-auto">
          <div className="m-auto w-96 border border-[#333] p-10 rounded-[13px] shadow-[0_0_7px_#44444440]">
            <img src={logoUrl} height="36" width="133" alt="Logo" className="mb-5" />
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: customTheme }}
              view="sign_in"
              showLinks={false}
              providers={[]}
              redirectTo={document.location.origin}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

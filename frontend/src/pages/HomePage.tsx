// @ts-expect-error keep react here
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { useAuth } from '../components/hooks/useAuth.tsx';
import supabase from '../supabaseClient.ts';
import customTheme from '../authCustomTheme.ts';
import authChangeEvents from '../authChangeEvents.ts';

// images
import logoUrl from '../../timething.svg';

// styles
import '../../css/pages/HomePage.css';

/**
 * Main page users land on when they visit the site.
 *
 */
export default function HomePage() {
  const { session, user, authChangeEvent } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();

  const upload = () => {
    navigate(state?.path || '/upload');
  };

  const signOut = () => {
    supabase.auth.signOut();
  };

  const isSignedIn = session && user && authChangeEvent === authChangeEvents.SIGNED_IN;
  const isSignedIn = session && user
    && (authChangeEvent === authChangeEvents.SIGNED_IN
      || authChangeEvent === authChangeEvents.INITIAL_SESSION);

  return (
    <div className="min-w-full min-h-screen screen">
      <div className="w-full h-screen flex bg-images">
        <main className="w-full mt-20 ml-20 flex flex-col items-start gap-3 pt-6 overflow-auto">
          <img src={logoUrl} height="36" width="180" alt="Logo" />
          <h1 className="mt-5 font-black">
            Make every word count.
            {' '}
            <br />
            Subtitle your videos, gain viewers.
          </h1>
          <h2 className="my-8 max-w-xl">
            <em>Bring it home.</em>
            {' '}
            Transcribe and subtitle your audio and
            video files with just one upload. Enhance accessibility, increase
            comprehension and break language barriers with subtitles.
          </h2>
          {isSignedIn ? (
            <div id="buttons">
              <div className="button">
                <label className="btn btn-lg btn-primary" onClick={upload}>
                  Upload
                </label>
              </div>
              <div className="button">
                <label className="btn btn-lg btn-primary" onClick={signOut}>
                  Sign out
                </label>
              </div>
            </div>
          ) : (
            <div className="w-96">
              <Auth
                supabaseClient={supabase}
                providers={['google']}
                appearance={{ theme: customTheme }}
                redirectTo={document.location.origin}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

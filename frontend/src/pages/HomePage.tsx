// @ts-expect-error keep react here
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuth } from '../components/hooks/useAuth.tsx';
import supabase from '../supabaseClient.ts';

// images
import logoUrl from '../../timething.svg';

/**
 * Main page users land on when they visit the site.
 *
 */
export default function HomePage() {
  const { session } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();

  const upload = () => {
    navigate(state?.path || '/upload');
  };

  const signOut = () => {
    supabase.auth.signOut();
  };

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
          {session ? (
            <div>
              <div className="button">
                <label className="btn btn-lg btn-primary" onClick={upload}>Upload</label>
              </div>
              <div className="button">
                <label className="btn btn-lg btn-primary" onClick={signOut}>Sign out</label>
              </div>
            </div>
          ) : (
            <Auth supabaseClient={supabase} providers={['google']} appearance={{ theme: ThemeSupa }} />
          )}
        </main>
      </div>
    </div>
  );
}

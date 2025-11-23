import { useState } from 'react';
import { AnimatedLogo } from './AnimatedLogo';
import { Input } from './ui/input';
import { Button } from './ui/button';
import logo from 'figma:asset/220dab80c3731b3a44f7ce1394443acd5caffa99.png';
import { authenticate } from '../lib/auth';

interface LoginPageProps {
  onLogin: (authorized: Array<'invoice' | 'kdr' | 'ga'>, username: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authorized = await authenticate(username, password);
      if (!authorized) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }
      onLogin(authorized, username.trim());
    } catch (err) {
      setError('Unable to verify credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-[#2a3144] rounded-lg p-8 shadow-2xl">
          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-8">
            <img src={logo} alt="Retaam Solutions" className="h-16" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-white mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 bg-[#242938] border-[#2a3144] text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-[#242938] border-[#2a3144] text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] hover:opacity-90 text-white h-11 animated-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
          {error && (
            <div className="mt-3 text-sm text-[#F54A45]">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Signature */}
          <div className="fixed bottom-4 right-4">
            <div className="flex items-center gap-4">
              <div className="h-0.5 w-64 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] animated-gradient"></div>
              <div className="text-right">
                <p className="text-gray-400 text-lg">PAA--Solutions Tool</p>
                <p className="text-gray-500 text-base">WWW.PAA-Solutions.com</p>
              </div>
            </div>
          </div>
    </div>
  );
}
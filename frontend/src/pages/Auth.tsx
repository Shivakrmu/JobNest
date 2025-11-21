import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Briefcase, GraduationCap, LogIn } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

// Declare Google types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "recruiter">("student");
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Sync profile to backend MongoDB
        try {
          await api.post('/users', {
            externalId: data.user.id,
            name: fullName,
            email,
            role: selectedRole === 'recruiter' ? 'recruiter' : 'student',
          });
        } catch (err) {
          console.error('Failed to sync profile to backend', err);
        }

        toast.success("Account created successfully!");
        navigate(selectedRole === "student" ? "/student/dashboard" : "/recruiter/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile to determine role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        toast.success("Welcome back!");
        navigate(profile?.role === "student" ? "/student/dashboard" : "/recruiter/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  // Load and initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const loadGoogleScript = () => {
      // Check if already loaded
      if (window.google) {
        initializeGoogleAuth();
        return;
      }

      // Check if script is already in DOM
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.google) {
            clearInterval(checkInterval);
            initializeGoogleAuth();
          }
        }, 100);
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
    };

    loadGoogleScript();
  }, [GOOGLE_CLIENT_ID]);

  // Handle Google Sign-In callback with ID token
  const handleGoogleCallback = async (response: any) => {
    try {
      setIsLoading(true);
      
      // response.credential contains the ID token
      const idToken = response.credential;

      // Send ID token to backend for verification
      const apiResponse = await api.post('/auth/google', {
        idToken,
        role: selectedRole === 'recruiter' ? 'employer' : 'student',
      });

      if (apiResponse.token) {
        localStorage.setItem('backend_token', apiResponse.token);
        localStorage.setItem('user', JSON.stringify(apiResponse.user));
        
        toast.success('Signed in with Google successfully!');
        navigate(apiResponse.user.role === 'employer' ? '/recruiter/dashboard' : '/student/dashboard');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error?.data?.error || error?.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In button click
  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID');
      return;
    }

    if (!window.google) {
      toast.error('Google Identity Services is still loading. Please try again in a moment.');
      return;
    }

    try {
      // Trigger One Tap sign-in prompt
      // This will show a popup for the user to sign in with Google
      window.google.accounts.id.prompt((notification: any) => {
        // If One Tap is not displayed (e.g., user dismissed it before), 
        // we can show a message or try alternative flow
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap was not shown, but the user can still sign in
          // The prompt might appear on next attempt
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        }
      });
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      toast.error('Failed to initialize Google Sign-In');
    }
  };

  // Legacy Supabase OAuth handler (keeping for backward compatibility)
  const handleOAuthSignIn = async (provider: 'google') => {
    try {
      setIsLoading(true);
      await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth` } });
      // The page will redirect to the provider and back; after redirect the effect below will handle session.
    } catch (err:any) {
      toast.error(err?.message || 'Failed to start OAuth flow');
    } finally {
      setIsLoading(false);
    }
  };

  // After OAuth redirect, Supabase will set the session. Ensure we sync the user to backend and navigate.
  // This runs on mount to pick up an existing session (e.g., after OAuth redirect).
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const name = (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || user.email || 'Student';
          // Exchange Supabase access token for a backend JWT and upsert user server-side
          try {
            const accessToken = (session as any).access_token || (session as any).provider_token || null;
            if (accessToken) {
              const resp = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/supabase', { headers: { Authorization: `Bearer ${accessToken}` }, method: 'POST' });
              if (resp.ok) {
                const data = await resp.json();
                if (data.token) localStorage.setItem('backend_token', data.token);
              } else {
                console.warn('Backend supabase exchange failed', await resp.text());
              }
            }
          } catch (err) {
            console.warn('Failed to exchange supabase token with backend', err);
          }
          // Navigate to dashboard; default to student for OAuth users (can add role selection later)
          navigate('/student/dashboard');
        }
      } catch (e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to JOBNEST
          </CardTitle>
          <CardDescription className="text-center">
            Connect students with amazing opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2" 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || !GOOGLE_CLIENT_ID}
                  >
                    <FcGoogle className="h-5 w-5" /> Continue with Google
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={selectedRole === "student" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedRole("student")}
                    >
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Student
                    </Button>
                    <Button
                      type="button"
                      variant={selectedRole === "recruiter" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedRole("recruiter")}
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      Recruiter
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2" 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || !GOOGLE_CLIENT_ID}
                  >
                    <FcGoogle className="h-5 w-5" /> Continue with Google
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

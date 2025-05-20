
"use client";

import type { FormEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogIn, UserPlus } from "lucide-react";
import type { SignUpCredentials } from '@/types/auth';

interface AuthFormProps {
  isSigningUp: boolean;
  formData: SignUpCredentials;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleLoginSubmit: (e: FormEvent) => Promise<void>;
  handleSignUpSubmit: (e: FormEvent) => Promise<void>;
  loading: boolean;
  error: string | null;
  toggleSignUpMode: () => void;
}

export function AuthForm({
  isSigningUp,
  formData,
  handleInputChange,
  handleLoginSubmit,
  handleSignUpSubmit,
  loading,
  error,
  toggleSignUpMode,
}: AuthFormProps) {
  return (
    <>
      <form onSubmit={isSigningUp ? handleSignUpSubmit : handleLoginSubmit}>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password || ""}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>
        {isSigningUp && (
          <>
            <div className="space-y-2 mt-4">
              <Label htmlFor="passwordConfirmation">Confirm Password</Label>
              <Input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                value={formData.passwordConfirmation || ""}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </>
        )}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-6" disabled={loading}>
          {isSigningUp ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
          {loading ? "Processing..." : (isSigningUp ? "Sign Up" : "Log In")}
        </Button>
      </form>
      <div className="flex justify-center mt-4">
        <Button variant="link" onClick={toggleSignUpMode} disabled={loading}>
          {isSigningUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </Button>
      </div>
    </>
  );
}

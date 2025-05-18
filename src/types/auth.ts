
export interface AuthCredentials {
  email: string;
  password?: string; // Password might be optional for some flows like OAuth
}

export interface SignUpCredentials extends AuthCredentials {
  displayName?: string; // Optional display name during sign-up
  passwordConfirmation?: string; // Optional for password confirmation UI
}

import { httpRequest } from "./http";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

type TokenPayload = {
  access_token: string;
  token_type: string;
};

export type LoginResponse = {
  token: TokenPayload;
  user: User;
};

export type RegisterInput = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
};

export async function registerUser(input: RegisterInput): Promise<User> {
  return httpRequest<User>("/auth/register", {
    method: "POST",
    auth: false,
    body: input,
    fallbackError: "Registration failed",
  });
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);

  return httpRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    fallbackError: "Login failed",
  });
}

export async function getCurrentUser(token: string): Promise<User> {
  return httpRequest<User>("/auth/me", {
    method: "GET",
    token,
    fallbackError: "Failed to fetch user profile",
  });
}

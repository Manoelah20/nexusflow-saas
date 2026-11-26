declare module 'next-auth' {
  interface User {
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    sessionVersion: number;
  }
}

export {};

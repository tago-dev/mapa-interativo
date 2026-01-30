declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      accessStatus?: string;
      role?: string;
    };
  }
}

export {};

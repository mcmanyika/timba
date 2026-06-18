import { createMiddleware } from "@tanstack/react-start";

import { getFirebaseAuth } from "./client";

export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const user = getFirebaseAuth().currentUser;
    const token = user ? await user.getIdToken() : null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

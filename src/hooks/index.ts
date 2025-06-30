import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isUserAdmin } from "../lib/admin";

/**
 * Hook for admin access control
 */
export function useAdmin() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user) {
        const adminStatus = isUserAdmin(user);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setIsCheckingAdmin(false);
    }
  }, [isLoaded, isSignedIn, user]);

  return {
    user,
    isLoaded,
    isSignedIn,
    isAdmin,
    isCheckingAdmin,
  };
}

/**
 * Hook for local storage management
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}


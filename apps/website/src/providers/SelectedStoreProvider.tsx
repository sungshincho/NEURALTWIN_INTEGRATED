/**
 * SelectedStoreProvider — manages the currently active store for dashboard pages.
 * Provides store list + selection with Supabase realtime subscription.
 * Origin: apps/os-dashboard/src/hooks/useSelectedStore.tsx
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export interface Store {
  id: string;
  store_name: string;
  store_code: string;
  address?: string;
  manager_name?: string;
  phone?: string;
  email?: string;
  metadata?: any;
  org_id?: string;
  organization_id?: string;
}

interface SelectedStoreContextType {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  stores: Store[];
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const SelectedStoreContext = createContext<
  SelectedStoreContextType | undefined
>(undefined);

export function SelectedStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, orgId } = useAuth();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    if (!user) {
      setStores([]);
      setSelectedStore(null);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: true });

      if (orgId) {
        query = query.eq("org_id", orgId);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        const isPermError =
          error.code === "42501" ||
          error.message?.includes("permission denied") ||
          (error as any).status === 403;
        if (isPermError) {
          console.warn(
            "stores table RLS policy missing, returning empty list",
          );
          setStores([]);
          return;
        }
        throw error;
      }

      setStores(data || []);

      if (data && data.length > 0 && !selectedStore) {
        setSelectedStore(data[0]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStores = async () => {
    setLoading(true);
    await fetchStores();
  };

  useEffect(() => {
    fetchStores();
  }, [user, orgId]);

  // Realtime subscription for store changes
  useEffect(() => {
    if (!user) return;

    const filter = orgId
      ? `org_id=eq.${orgId}`
      : `user_id=eq.${user.id}`;

    const channel = supabase
      .channel("stores-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stores",
          filter,
        },
        () => {
          fetchStores();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orgId]);

  return (
    <SelectedStoreContext.Provider
      value={{
        selectedStore,
        setSelectedStore,
        stores,
        loading,
        refreshStores,
      }}
    >
      {children}
    </SelectedStoreContext.Provider>
  );
}

export function useSelectedStore() {
  const context = useContext(SelectedStoreContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedStore must be used within a SelectedStoreProvider",
    );
  }
  return context;
}

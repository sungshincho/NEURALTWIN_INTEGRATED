/**
 * Re-export from unified AuthProvider for backward compatibility.
 * All components that import from '@/hooks/useAuth' continue to work.
 */
export { useAuth } from "@/providers/AuthProvider";
export type { AuthContextType } from "@/providers/AuthProvider";

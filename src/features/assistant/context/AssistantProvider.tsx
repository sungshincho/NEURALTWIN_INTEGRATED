/**
 * Assistant Context Provider
 * 하위 컴포넌트에 어시스턴트 관련 상태 제공
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAssistantContext, AssistantContext } from '../hooks/useAssistantContext';

interface AssistantProviderContextType {
  context: AssistantContext;
}

const AssistantProviderContext = createContext<AssistantProviderContextType | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const context = useAssistantContext();

  return (
    <AssistantProviderContext.Provider value={{ context }}>
      {children}
    </AssistantProviderContext.Provider>
  );
}

export function useAssistantProvider(): AssistantProviderContextType {
  const ctx = useContext(AssistantProviderContext);
  if (!ctx) {
    throw new Error('useAssistantProvider must be used within AssistantProvider');
  }
  return ctx;
}

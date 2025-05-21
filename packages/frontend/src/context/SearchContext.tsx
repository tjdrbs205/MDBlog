import React, { createContext, ReactNode, useContext, useState } from "react";

interface SearchContextType {
  searchTerm: SearchParams;
  setSearchTerm: (term: SearchParams) => void;
}

const SearchContext = createContext<SearchContextType>({
  searchTerm: {},
  setSearchTerm: () => {},
});

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState<SearchParams>({});

  const value: SearchContextType = {
    searchTerm,
    setSearchTerm,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);

  if (context === undefined) {
    throw new Error("useSearchParams must be used within a SearchProvider");
  }

  return context;
};

interface SearchParams {
  page?: number;
  category?: string;
  sort?: string;
  q?: string;
}

interface SearchComponentProps {
  placeholder?: string;
  className?: string;
  onSumit?: (Term: string) => void;
}

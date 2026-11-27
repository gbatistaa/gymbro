import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCount } from "@/lib/format";
import { Button } from "./button";
import styles from "./ui.module.css";

type PaginationProps = {
  /** Página atual, começando em 0 (como a API). */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  isDisabled?: boolean;
};

/** Anterior / próxima com a posição atual. Some quando tudo cabe numa página. */
export function Pagination({ page, totalPages, onChange, isDisabled = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <Button
        variant="secondary"
        size="sm"
        disabled={isDisabled || page <= 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        Anterior
      </Button>
      <span className={styles.paginationStatus} aria-live="polite">
        Página {formatCount(page + 1)} de {formatCount(totalPages)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={isDisabled || page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        Próxima
        <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </Button>
    </nav>
  );
}

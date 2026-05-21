"use client";

interface PaginationProps {
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  pages,
  hasNext,
  hasPrev,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <div className="text-sm text-gray-600">
        Page {page} of {pages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="px-3 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pageNum === page
                  ? "bg-gray-900 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="px-3 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

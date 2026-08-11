// Helper for filtering and sorting beat folder files
export type BeatFolderSortMode = "name-asc" | "name-desc" | "size-asc" | "size-desc";

export interface BeatFolderFile {
  filename: string;
  url: string;
  size: number;
  modified: string;
}

export function filterAndSortBeatFiles(
  files: BeatFolderFile[],
  searchQuery: string,
  sortMode: BeatFolderSortMode
): BeatFolderFile[] {
  let result = [...files];

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(f => f.filename.toLowerCase().includes(q));
  }

  // Sort
  switch (sortMode) {
    case "name-asc":
      result.sort((a, b) => a.filename.localeCompare(b.filename));
      break;
    case "name-desc":
      result.sort((a, b) => b.filename.localeCompare(a.filename));
      break;
    case "size-asc":
      result.sort((a, b) => a.size - b.size);
      break;
    case "size-desc":
      result.sort((a, b) => b.size - a.size);
      break;
  }

  return result;
}

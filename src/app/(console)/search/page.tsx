"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, Sparkles, Filter, X } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Card } from "@/src/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { SearchResults } from "@/src/components/console/search"
import { useWorkspace } from "@/src/context/workspace-context"
import { searchApi, type SearchResult } from "@/src/lib/api/search"
import { toast } from "sonner"
import type { ContentType } from "@/src/types/workspace"


export default function SearchPage() {
  const { currentWorkspace } = useWorkspace()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchType, setSearchType] = useState<"semantic" | "hybrid">("semantic")
  const [selectedContentType, setSelectedContentType] = useState<ContentType | "all">("all")
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    if (!currentWorkspace) {
      setResults([])
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const searchInput = {
        query: searchQuery.trim(),
        limit: 2,
        filters: {
          ...(selectedContentType !== "all" && {
            contentType: selectedContentType,
          }),
        },
      }

      const searchFn =
        searchType === "semantic"
          ? searchApi.semanticSearch
          : searchApi.hybridSearch

      const response = await searchFn(currentWorkspace.id, searchInput)
      setResults(response.results)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [currentWorkspace, searchType, selectedContentType])

  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery, handleSearch])


  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">
            Please select a workspace to start searching
          </p>
          <Button onClick={() => window.location.href = "/home"}>
            Go to Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col mt-4">

      <Card className="p-6 shrink-0">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-10 h-8 text-shadow-accent-foreground"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
            />
          </div>

          <div className="flex items-center justify-between">
            <Tabs
              value={searchType}
              onValueChange={(value: string) => setSearchType(value as "semantic" | "hybrid")}
            >
              <TabsList>
                <TabsTrigger value="semantic" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Semantic
                </TabsTrigger>
                <TabsTrigger value="hybrid" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Hybrid
                </TabsTrigger>
              </TabsList>
            </Tabs>

          </div>

        </div>
      </Card>

      <div className="flex-1 overflow-y-auto min-h-0">
        {hasSearched ? (
          <SearchResults
            results={results}
            query={query}
            isLoading={isSearching}
          />
        ) : (
          <div className="text-center py-12">
          </div>
        )}
      </div>
    </div>
  );
}
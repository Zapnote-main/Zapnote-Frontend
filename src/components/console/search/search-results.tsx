"use client"

import { ExternalLink, Sparkles } from "lucide-react"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import type { SearchResult } from "@/src/lib/api/search"
import type { ContentType } from "@/src/types/workspace"
import { cn } from "@/src/lib/utils"

interface SearchResultsProps {
    results: SearchResult[]
    query: string
    isLoading?: boolean
}

const contentTypeColors: Record<ContentType, string> = {
    ARTICLE: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    VIDEO: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    DOCUMENT: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    AUDIO: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    "SOCIAL POST": "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    CODE: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    IMAGE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    OTHER: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export function SearchResults({ results, query, isLoading }: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-4 bg-muted rounded w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="h-3 bg-muted rounded w-full" />
                                <div className="h-3 bg-muted rounded w-5/6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-2">No results found</p>
                <p className="text-sm text-muted-foreground">
                    Try different keywords or filters
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Found <span className="font-semibold text-foreground">{results.length}</span> results for &quot;{query}&quot;
                </p>
            </div>

            <div className="space-y-3">
                {results.map((result) => (
                    <Card
                        key={result.id}
                        className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs font-medium",
                                                contentTypeColors[result.contentType as ContentType]
                                            )}
                                        >
                                            {result.contentType}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Sparkles className="h-3 w-3" />
                                            <span>{Math.round(result.similarity * 100)}% match</span>
                                        </div>
                                    </div>
                                    <a
                                        href={result.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block font-semibold hover:underline line-clamp-2 text-base group-hover:text-primary transition-colors"
                                    >
                                        {result.title || result.sourceUrl}
                                    </a>
                                </div>

                                <a
                                    href={result.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </CardHeader>

                        {result.summary && (
                            <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {result.summary}
                                </p>

                                {result.tags && result.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {result.tags.slice(0, 5).map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {result.tags.length > 5 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{result.tags.length - 5} more
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                ))
                }
            </div >
        </div >
    )
}
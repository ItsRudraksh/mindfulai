"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, Plus, Search, Filter, Calendar, Heart, 
  ArrowLeft, Star, Clock, FileText, TrendingUp, Tag,
  MoreVertical, Edit, Trash2, Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';

export default function JournalView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);

  const router = useRouter();
  const user = useQuery(api.users.current);
  const journalEntries = useQuery(api.journalEntries.getUserJournalEntries, { limit: 20 });
  const journalStats = useQuery(api.journalEntries.getJournalStats);
  const deleteEntryMutation = useMutation(api.journalEntries.deleteJournalEntry);
  const updateEntryMutation = useMutation(api.journalEntries.updateJournalEntry);

  const handleCreateNewEntry = () => {
    router.push('/journal/new');
  };

  const handleDeleteEntry = async (entryId: Id<"journalEntries">) => {
    try {
      await deleteEntryMutation({ entryId });
      toast.success('Journal entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete journal entry');
    }
  };

  const handleToggleFavorite = async (entryId: Id<"journalEntries">, isFavorite: boolean) => {
    try {
      await updateEntryMutation({ entryId, isFavorite: !isFavorite });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getPreviewText = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      // Extract plain text from rich text content
      const extractText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (node.text) return node.text;
        if (node.content) {
          return node.content.map(extractText).join('');
        }
        return '';
      };
      return extractText(parsed).substring(0, 150) + '...';
    } catch {
      return content.substring(0, 150) + '...';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white/60 to-orange-50/40 dark:from-amber-950/40 dark:via-gray-900/60 dark:to-orange-950/40 backdrop-blur-therapeutic">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild className="therapeutic-hover">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/20 flex items-center justify-center"
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-semibold">My Journal</h1>
                  <p className="text-sm text-muted-foreground">
                    {journalEntries?.length || 0} entries • {journalStats?.totalWords || 0} words written
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="therapeutic-hover"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Stats
              </Button>
              <Button onClick={handleCreateNewEntry} className="therapeutic-hover ripple-effect">
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && journalStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="glass-card floating-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Journal Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{journalStats.totalEntries}</div>
                      <div className="text-sm text-muted-foreground">Total Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{journalStats.totalWords}</div>
                      <div className="text-sm text-muted-foreground">Words Written</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{journalStats.longestStreak}</div>
                      <div className="text-sm text-muted-foreground">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{journalStats.recentEntries}</div>
                      <div className="text-sm text-muted-foreground">This Month</div>
                    </div>
                  </div>
                  
                  {journalStats.topTags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Most Used Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {journalStats.topTags.map(({ tag, count }) => (
                          <Badge key={tag} variant="secondary" className="backdrop-blur-subtle">
                            {tag} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <div className="mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your journal entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-input"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="therapeutic-hover">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="therapeutic-hover">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journal Entries */}
        {journalEntries && journalEntries.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalEntries.map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full glass-card floating-card therapeutic-hover cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {entry.title || 'Untitled Entry'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.createdAt)}</span>
                          {entry.wordCount && (
                            <>
                              <span>•</span>
                              <span>{entry.wordCount} words</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {entry.isFavorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="glass-card">
                            <DropdownMenuItem onClick={() => router.push(`/journal/${entry._id}`)} className="therapeutic-hover">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleFavorite(entry._id, entry.isFavorite || false)}
                              className="therapeutic-hover"
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {entry.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEntry(entry._id)}
                              className="therapeutic-hover text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="pt-0 cursor-pointer"
                    onClick={() => router.push(`/journal/${entry._id}`)}
                  >
                    <p className="text-sm text-muted-foreground line-clamp-4 mb-4">
                      {entry.plainTextContent ? entry.plainTextContent.substring(0, 150) + '...' : getPreviewText(entry.content)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {entry.mood && (
                          <Badge variant="outline" className="text-xs backdrop-blur-subtle">
                            <Heart className="h-3 w-3 mr-1" />
                            {entry.mood}
                          </Badge>
                        )}
                        {entry.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs backdrop-blur-subtle">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags && entry.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs backdrop-blur-subtle">
                            +{entry.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      
                      {entry.readingTime && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {entry.readingTime} min read
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div 
              className="w-24 h-24 bg-amber-100 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto mb-6"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <BookOpen className="h-12 w-12 text-amber-600" />
            </motion.div>
            <h3 className="text-2xl font-semibold mb-4">Start Your Journal Journey</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Begin documenting your thoughts, feelings, and experiences. Your first entry is just a click away.
            </p>
            <Button onClick={handleCreateNewEntry} size="lg" className="therapeutic-hover ripple-effect">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Entry
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
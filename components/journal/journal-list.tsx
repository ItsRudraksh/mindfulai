"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Clock,
  FileText,
  BookOpen,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface JournalListProps {
  onCreateNew?: () => void;
  onSelectEntry?: (entryId: Id<"journalEntries">) => void;
}

const JournalList: React.FC<JournalListProps> = ({ onCreateNew, onSelectEntry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  const journalEntries = useQuery(api.journalEntries.getUserJournalEntries, { limit: 50 });
  const searchResults = useQuery(
    api.journalEntries.searchJournalEntries,
    searchTerm.length > 2 ? { searchTerm, limit: 20 } : "skip"
  );
  
  const createJournalEntry = useMutation(api.journalEntries.createJournalEntry);
  const deleteJournalEntry = useMutation(api.journalEntries.deleteJournalEntry);

  const displayEntries = searchTerm.length > 2 ? searchResults : journalEntries;
  const sortedEntries = displayEntries?.slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleCreateNew = async () => {
    try {
      const entryId = await createJournalEntry({
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
      });
      
      if (onSelectEntry) {
        onSelectEntry(entryId);
      } else {
        router.push(`/journal/${entryId}`);
      }
      
      toast.success('New journal entry created!');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to create journal entry');
    }
  };

  const handleDeleteEntry = async (entryId: Id<"journalEntries">) => {
    try {
      await deleteJournalEntry({ entryId });
      toast.success('Journal entry deleted');
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast.error('Failed to delete journal entry');
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
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getContentPreview = (content: any) => {
    if (!content || !content.content) return 'No content';
    
    const textContent = content.content
      .map((node: any) => {
        if (node.type === 'paragraph' && node.content) {
          return node.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('');
        }
        return '';
      })
      .join(' ')
      .trim();
    
    return textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
  };

  const getWordCount = (content: any) => {
    const preview = getContentPreview(content);
    return preview === 'No content' ? 0 : preview.split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            My Journal
          </h1>
          <p className="text-muted-foreground">
            {sortedEntries?.length || 0} entries
          </p>
        </div>
        
        <Button onClick={onCreateNew || handleCreateNew} className="therapeutic-hover ripple-effect">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your journal entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-input"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="therapeutic-hover"
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="h-4 w-4 mr-2" />
            ) : (
              <SortAsc className="h-4 w-4 mr-2" />
            )}
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Button>
        </div>
      </motion.div>

      {/* Entries Grid */}
      <AnimatePresence>
        {sortedEntries && sortedEntries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedEntries.map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Card className="glass-card floating-card therapeutic-hover cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {entry.title || 'Untitled'}
                      </CardTitle>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="glass-card">
                          <DropdownMenuItem
                            onClick={() => {
                              if (onSelectEntry) {
                                onSelectEntry(entry._id);
                              } else {
                                router.push(`/journal/${entry._id}`);
                              }
                            }}
                            className="therapeutic-hover"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive therapeutic-hover"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{entry.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEntry(entry._id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent
                    className="space-y-4"
                    onClick={() => {
                      if (onSelectEntry) {
                        onSelectEntry(entry._id);
                      } else {
                        router.push(`/journal/${entry._id}`);
                      }
                    }}
                  >
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {getContentPreview(entry.content)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{getWordCount(entry.content)} words</span>
                        </div>
                      </div>
                      
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1">
                          {entry.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No entries found' : 'Start your journal journey'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm
                ? `No entries match "${searchTerm}". Try a different search term.`
                : 'Create your first journal entry to begin documenting your thoughts, experiences, and personal growth.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onCreateNew || handleCreateNew} size="lg" className="therapeutic-hover ripple-effect">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Entry
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalList;
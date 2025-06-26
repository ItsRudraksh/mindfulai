"use client";

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import tippy from 'tippy.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

import EditorToolbar from './editor-toolbar';
import SlashCommand, { SlashCommandRef } from './slash-command';

interface JournalEditorProps {
  entryId?: Id<"journalEntries">;
  initialContent?: any;
  initialTitle?: string;
  onSave?: (content: any, title: string) => void;
  placeholder?: string;
  className?: string;
}

// Slash command extension
const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        view() {
          return {
            update: (view, prevState) => {
              const { state } = view;
              const { selection } = state;
              const { from, to } = selection;

              // Check if we're at the start of a line and typed '/'
              const text = state.doc.textBetween(from - 1, to, '');
              if (text === '/') {
                // Show slash command menu
                this.showSlashCommand(view, from - 1, to);
              }
            },
          };
        },
      }),
    ];
  },
});

const JournalEditor: React.FC<JournalEditorProps> = ({
  entryId,
  initialContent,
  initialTitle = '',
  onSave,
  placeholder = "Start writing your thoughts...",
  className = '',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandRange, setSlashCommandRange] = useState<any>(null);
  
  const slashCommandRef = useRef<SlashCommandRef>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const updateJournalEntry = useMutation(api.journalEntries.updateJournalEntry);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80 transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'What\'s the heading?';
          }
          return placeholder;
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: initialContent || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4',
      },
      handleKeyDown: (view, event) => {
        // Handle slash command navigation
        if (showSlashCommand && slashCommandRef.current) {
          return slashCommandRef.current.onKeyDown(event);
        }

        // Show slash command on '/' at start of line
        if (event.key === '/' && view.state.selection.empty) {
          const { from } = view.state.selection;
          const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from, '');
          
          if (textBefore === '' || textBefore === '\n') {
            // We'll handle this in the update function
            return false;
          }
        }

        // Hide slash command on escape
        if (event.key === 'Escape' && showSlashCommand) {
          setShowSlashCommand(false);
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Check for slash command
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;

      // Look for '/' at the beginning of a line
      const textBefore = state.doc.textBetween(Math.max(0, from - 10), from, '');
      const match = textBefore.match(/\/[\w\s]*$/);

      if (match) {
        const startPos = from - match[0].length;
        setSlashCommandRange({ from: startPos, to: from });
        setShowSlashCommand(true);
      } else {
        setShowSlashCommand(false);
      }

      // Auto-save
      debouncedSave();
    },
  });

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveContent();
    }, 1500);
  }, [editor, title, entryId]);

  const saveContent = async () => {
    if (!editor || !entryId) return;

    setIsSaving(true);
    try {
      const content = editor.getJSON();
      await updateJournalEntry({
        entryId,
        title: title || 'Untitled',
        content,
      });
      
      setLastSaved(new Date());
      if (onSave) {
        onSave(content, title);
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          editor?.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveContent();
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Save Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground flex-1 mr-4"
          onBlur={debouncedSave}
        />
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Save className="h-4 w-4" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </>
          ) : null}
        </div>
      </motion.div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />

      {/* Editor */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card border border-border/20 rounded-lg overflow-hidden min-h-[600px]"
        >
          <EditorContent editor={editor} />
        </motion.div>

        {/* Slash Command Menu */}
        <AnimatePresence>
          {showSlashCommand && slashCommandRange && (
            <div className="absolute z-50" style={{ 
              top: '100px', // You'd calculate this based on cursor position
              left: '50px' 
            }}>
              <SlashCommand
                ref={slashCommandRef}
                editor={editor}
                range={slashCommandRange}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-xs text-muted-foreground"
      >
        <div className="flex flex-wrap gap-4">
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+B</kbd> Bold</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+I</kbd> Italic</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd> Link</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> Commands</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd> Undo</span>
        </div>
      </motion.div>
    </div>
  );
};

export default JournalEditor;
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
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Details from '@tiptap/extension-details';
import DetailsContent from '@tiptap/extension-details-content';
import DetailsSummary from '@tiptap/extension-details-summary';
import Emoji from '@tiptap/extension-emoji';
import FileHandler from '@tiptap/extension-file-handler';
import FontFamily from '@tiptap/extension-font-family';
import Mathematics from '@tiptap/extension-mathematics';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { createLowlight, common } from 'lowlight';

import EditorToolbar from './editor-toolbar';
import SlashCommand, { SlashCommandRef } from './slash-command';
import EditorBubbleMenu from './editor-bubble-menu';
import EditorFloatingMenu from './editor-floating-menu';

interface JournalEditorProps {
  entryId?: Id<"journalEntries">;
  initialContent?: any;
  initialTitle?: string;
  onSave?: (content: any, title: string) => void;
  placeholder?: string;
  className?: string;
}

const lowlight = createLowlight(common);

// Create a plugin key for the slash command
const slashCommandPluginKey = new PluginKey('slashCommand');

// Slash command extension with proper plugin state handling
const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: slashCommandPluginKey,
        state: {
          init() {
            return {
              open: false,
              range: null,
            };
          },
          apply(tr, prev) {
            const { selection } = tr;
            const next = { ...prev };

            // Check if we should show slash command
            if (selection.empty) {
              const { from } = selection;
              const textBefore = tr.doc.textBetween(Math.max(0, from - 10), from, '');
              const match = textBefore.match(/\/[\w\s]*$/);

              if (match) {
                const startPos = from - match[0].length;
                next.open = true;
                next.range = { from: startPos, to: from };
              } else {
                next.open = false;
                next.range = null;
              }
            } else {
              next.open = false;
              next.range = null;
            }

            return next;
          },
        },
        props: {
          handleKeyDown: (view, event) => {
            // Get plugin state using the plugin key
            const pluginState = slashCommandPluginKey.getState(view.state);

            if (!pluginState?.open) return false;

            // Let the slash command component handle the key events
            return false;
          },
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
  const [slashCommandPosition, setSlashCommandPosition] = useState<{ top: number; left: number } | null>(null);

  const slashCommandRef = useRef<SlashCommandRef>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Details,
      DetailsContent,
      DetailsSummary,
      Emoji,
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(file => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
              currentEditor.chain().insertContentAt(pos, {
                type: 'image',
                attrs: {
                  src: fileReader.result,
                },
              }).focus().run();
            };
          });
        },
        onPaste: (currentEditor, files, htmlContent) => {
          files.forEach(file => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
              currentEditor.chain().insertContent({
                type: 'image',
                attrs: {
                  src: fileReader.result,
                },
              }).focus().run();
            };
          });
        },
      }),
      FontFamily,
      Mathematics.configure({
        HTMLAttributes: {
          class: 'math-node',
        },
        katexOptions: {
          throwOnError: false,
        },
      }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
      }),
      TableCell,
      TableHeader,
      TableRow,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      Underline,
      Youtube.configure({
        nocookie: true,
        width: 640,
        height: 480,
        modestBranding: true,
      }),
      SlashCommandExtension,
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
          const handled = slashCommandRef.current.onKeyDown(event);
          if (handled) {
            return true;
          }
        }

        // Hide slash command on escape
        if (event.key === 'Escape' && showSlashCommand) {
          setShowSlashCommand(false);
          setSlashCommandRange(null);
          setSlashCommandPosition(null);
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Check for slash command using the plugin state
      const pluginState = slashCommandPluginKey.getState(editor.state);
      
      if (pluginState?.open && pluginState?.range) {
        setSlashCommandRange(pluginState.range);
        
        // Calculate position safely
        try {
          const coords = editor.view.coordsAtPos(pluginState.range.from);
          const editorRect = editorRef.current?.getBoundingClientRect();
          
          if (coords && editorRect) {
            setSlashCommandPosition({
              top: coords.top - editorRect.top + 25,
              left: coords.left - editorRect.left,
            });
            setShowSlashCommand(true);
          }
        } catch (error) {
          console.warn('Could not calculate slash command position:', error);
          setShowSlashCommand(false);
        }
      } else {
        setShowSlashCommand(false);
        setSlashCommandRange(null);
        setSlashCommandPosition(null);
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
    if (!editor || !entryId) {
      return;
    }

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
      <div className="relative" ref={editorRef}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card border border-border/20 rounded-lg overflow-hidden min-h-[600px] relative"
        >
          <EditorContent editor={editor} />

          {/* Slash Command Menu */}
          <AnimatePresence>
            {showSlashCommand && slashCommandRange && slashCommandPosition && (
              <div
                className="absolute z-50"
                style={{
                  top: `${slashCommandPosition.top}px`,
                  left: `${slashCommandPosition.left}px`,
                }}
              >
                <SlashCommand
                  ref={slashCommandRef}
                  editor={editor}
                  range={slashCommandRange}
                />
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bubble Menu */}
        <EditorBubbleMenu editor={editor} />
        
        {/* Floating Menu */}
        <EditorFloatingMenu editor={editor} />
      </div>

      {/* Character Count */}
      {editor.extensionManager.extensions.find(ext => ext.name === 'characterCount') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-muted-foreground text-right"
        >
          {editor.storage.characterCount.characters()} characters, {editor.storage.characterCount.words()} words
        </motion.div>
      )}

      {/* Keyboard Shortcuts Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-xs text-muted-foreground"
      >
        <div className="flex flex-wrap gap-4">
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+B</kbd> Bold</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+I</kbd> Italic</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+U</kbd> Underline</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd> Link</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> Commands</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd> Undo</span>
        </div>
      </motion.div>
    </div>
  );
};

export default JournalEditor;
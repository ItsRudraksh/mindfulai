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
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

// Import all TipTap extensions
import BubbleMenu from '@tiptap/extension-bubble-menu';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import DragHandle from '@tiptap/extension-drag-handle';
import FileHandler from '@tiptap/extension-file-handler';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
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
              range: null as { from: number; to: number } | null,
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
  const [slashMenuHeight, setSlashMenuHeight] = useState<number>(0);

  const slashCommandRef = useRef<SlashCommandRef>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const updateJournalEntry = useMutation(api.journalEntries.updateJournalEntry);
  const triggerUpdateGlobalMemoryFromJournal = useAction(api.globalMemory.updateGlobalMemoryFromJournal);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      // Enhanced Image with better styling
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto shadow-md my-4 cursor-pointer hover:shadow-lg transition-shadow',
        },
        allowBase64: true
      }),

      // Enhanced Link with click handling
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        validate: url => /^https?:\/\//.test(url),
      }),

      // Enhanced Placeholder
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'What\'s the heading?';
          }
          if (node.type.name === 'detailsSummary') {
            return 'Summary...';
          }
          if (node.type.name === 'detailsContent') {
            return 'Details content...';
          }
          return placeholder;
        },
        includeChildren: true,
      }),

      // Text styling
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),

      // Enhanced Highlight
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'px-1 py-0.5 rounded',
        },
      }),

      // Character count
      CharacterCount,

      // Code blocks with syntax highlighting
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-card rounded-lg p-4 my-4 overflow-x-auto',
        },
      }),

      DragHandle,

      // File handler for drag & drop
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
                  alt: file.name,
                  title: file.name,
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
                  alt: file.name,
                  title: file.name,
                },
              }).focus().run();
            };
          });
        },
      }),
      // Subscript and Superscript
      Subscript,
      Superscript,

      // Task lists
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item flex items-start gap-2 my-1',
        },
      }),

      // Text alignment
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),

      // Typography enhancements
      Typography.configure({
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: '\'',
        closeSingleQuote: '\'',
        ellipsis: '…',
        emDash: '—',
      }),

      // Underline
      Underline,

      // YouTube embeds
      Youtube.configure({
        nocookie: true,
        width: 640,
        height: 480,
        modestBranding: true,
        HTMLAttributes: {
          class: 'youtube-embed rounded-lg my-4 mx-auto',
        },
      }),

      // Bubble and Floating menus
      BubbleMenu.configure({
        element: document.createElement('div'),
      }),

      // Slash command extension
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
        class: 'tiptap ProseMirror prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4',
        spellcheck: 'true',
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
            let calculatedTop = coords.top - editorRect.top + 25; // Default: 25px below cursor
            const menuHeight = slashMenuHeight || 300; // Use actual height or estimate
            const spaceBelow = editorRect.height - (coords.top - editorRect.top);

            // If not enough space below, position above
            if (spaceBelow < menuHeight && (coords.top - editorRect.top) > menuHeight) {
              calculatedTop = coords.top - editorRect.top - menuHeight - 10; // 10px above cursor
            }

            setSlashCommandPosition({
              top: calculatedTop,
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

  // Measure slash menu height once it's visible
  useEffect(() => {
    if (showSlashCommand && slashMenuRef.current && slashMenuHeight === 0) {
      setSlashMenuHeight(slashMenuRef.current.offsetHeight);
    }
  }, [showSlashCommand, slashMenuHeight]);

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
          editor?.chain().focus().setImage({ src: url, alt: file.name, title: file.name }).run();

          // Set up a timer to check if the image is still in the editor after 10 seconds
          // In a real implementation, this would upload to Cloudinary
          setTimeout(() => {
            if (editor && editor.isActive('image')) {
              console.log('Image still in editor after 10 seconds - would upload to Cloudinary');
              // Here you would upload to Cloudinary and update the src
            }
          }, 10000);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Save on unmount and update global memory
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveContent().then(() => {
          // Update global memory when leaving the journal page
          if (entryId) {
            triggerUpdateGlobalMemoryFromJournal({ userId: 'current' }).catch(error => {
              console.error('Error updating global memory from journal:', error);
            });
          }
        });
      }
    };
  }, [entryId, triggerUpdateGlobalMemoryFromJournal]);

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
                  menuRef={slashMenuRef}
                  editor={editor}
                  range={slashCommandRange}
                />
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bubble Menu */}
        <EditorBubbleMenu editor={editor} />
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
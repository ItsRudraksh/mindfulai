"use client";

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { motion } from 'framer-motion';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { createLowlight, common } from 'lowlight';

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

import EditorToolbar from './editor-toolbar';
import EditorBubbleMenu from './editor-bubble-menu';
import EditorFloatingMenu from './editor-floating-menu';
import SlashCommand from './slash-command';

interface JournalEditorProps {
  entryId: Id<"journalEntries">;
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
      }),
    ];
  },
});

// Custom extension to handle image uploads
const ImageUploadExtension = Extension.create({
  name: 'imageUpload',

  addStorage() {
    return {
      pendingUploads: new Map<string, { timestamp: number, uploaded: boolean }>(),
    };
  },

  onUpdate() {
    // This will run on every editor update
    this.storage.pendingUploads.forEach((data, imageUrl) => {
      const now = Date.now();
      
      // If image has been in editor for more than 10 seconds and not uploaded
      if (!data.uploaded && now - data.timestamp > 10000) {
        this.options.onImageStabilized(imageUrl);
        
        // Mark as uploaded to prevent duplicate uploads
        this.storage.pendingUploads.set(imageUrl, {
          ...data,
          uploaded: true
        });
      }
    });
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            paste(view, event) {
              // Let the default paste handler run first
              return false;
            }
          }
        },
        appendTransaction(transactions, oldState, newState) {
          // Check if any images were added in these transactions
          let hasNewImages = false;
          
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'image') {
              const src = node.attrs.src;
              
              // Only track base64 images
              if (src && src.startsWith('data:image') && !extension.storage.pendingUploads.has(src)) {
                extension.storage.pendingUploads.set(src, {
                  timestamp: Date.now(),
                  uploaded: false
                });
                hasNewImages = true;
              }
            }
          });
          
          return null;
        }
      })
    ];
  }
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
  const [pendingImageUploads, setPendingImageUploads] = useState<Map<string, string>>(new Map());
  const [slashCommandOpen, setSlashCommandOpen] = useState(false);
  const [slashCommandRange, setSlashCommandRange] = useState<{ from: number, to: number } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const slashCommandRef = useRef<HTMLDivElement>(null);
  const slashCommandHandlerRef = useRef<any>(null);

  const updateJournalEntry = useMutation(api.journalEntries.updateJournalEntry);
  const uploadImage = useAction(api.journalEntries.uploadImage);

  // Handle image upload to Convex storage
  const handleImageStabilized = async (imageUrl: string) => {
    if (!imageUrl.startsWith('data:image')) return;
    
    try {
      const result = await uploadImage({
        base64Image: imageUrl,
        journalEntryId: entryId,
      });
      
      if (result.success) {
        // Store the mapping of base64 to Convex URL
        setPendingImageUploads(prev => {
          const newMap = new Map(prev);
          newMap.set(imageUrl, result.url);
          return newMap;
        });
        
        // Update the image in the editor
        if (editor) {
          // Find all instances of this image and replace them
          const { state, view } = editor;
          const { tr } = state;
          let hasChanges = false;
          
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'image' && node.attrs.src === imageUrl) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                src: result.url,
              });
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            view.dispatch(tr);
            
            // Save the entry with updated content
            debouncedSave();
          }
        }
      }
    } catch (error) {
      console.error('Error uploading image to Convex storage:', error);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto shadow-md my-4 cursor-pointer hover:shadow-lg transition-shadow',
        },
        allowBase64: true,
        draggable: true,
      }),
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
      Placeholder.configure({
        placeholder,
        includeChildren: true,
      }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted rounded-lg p-4 my-4 overflow-x-auto',
        },
      }),
      DragHandle.configure({
        HTMLAttributes: {
          class: 'tiptap-drag-handle',
        },
      }),
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
      Subscript,
      Superscript,
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
        modestBranding: true,
      }),
      BubbleMenu.configure({
        element: document.createElement('div'),
      }),
      SlashCommandExtension,
      ImageUploadExtension.configure({
        onImageStabilized: handleImageStabilized,
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
        class: 'tiptap ProseMirror prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave();
    },
  });

  // Monitor slash command state
  useEffect(() => {
    if (!editor) return;

    const updateSlashCommandState = () => {
      const { state } = editor;
      const pluginState = slashCommandPluginKey.getState(state);
      
      if (pluginState?.open && pluginState?.range) {
        setSlashCommandOpen(true);
        setSlashCommandRange(pluginState.range);
      } else {
        setSlashCommandOpen(false);
        setSlashCommandRange(null);
      }
    };

    editor.on('transaction', updateSlashCommandState);
    return () => {
      editor.off('transaction', updateSlashCommandState);
    };
  }, [editor]);

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
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Handle slash command keyboard events
  const handleSlashCommandKeyDown = (event: KeyboardEvent) => {
    if (!slashCommandOpen || !slashCommandHandlerRef.current) return false;
    return slashCommandHandlerRef.current.onKeyDown(event);
  };

  // Add keyboard event listener for slash command
  useEffect(() => {
    if (!editor || !slashCommandOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (slashCommandOpen) {
        handleSlashCommandKeyDown(event);
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, slashCommandOpen]);

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
          {slashCommandOpen && slashCommandRange && (
            <div
              className="absolute z-50"
              style={{
                left: editor.view.coordsAtPos(slashCommandRange.from).left,
                top: editor.view.coordsAtPos(slashCommandRange.from).bottom,
              }}
            >
              <SlashCommand
                editor={editor}
                range={slashCommandRange}
                menuRef={slashCommandRef}
                ref={slashCommandHandlerRef}
              />
            </div>
          )}
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
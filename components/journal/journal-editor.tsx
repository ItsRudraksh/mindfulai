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
import { Save, Loader2, Smile } from 'lucide-react';

// Import all TipTap extensions
import BubbleMenu from '@tiptap/extension-bubble-menu';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Details from '@tiptap/extension-details';
import DetailsContent from '@tiptap/extension-details-content';
import DetailsSummary from '@tiptap/extension-details-summary';
import DragHandle from '@tiptap/extension-drag-handle';
import Emoji from '@tiptap/extension-emoji';
import FileHandler from '@tiptap/extension-file-handler';
import FloatingMenu from '@tiptap/extension-floating-menu';
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
        // Disable default history to use our own
        history: false,
      }),
      
      // Enhanced Image with better styling
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto shadow-md my-4 cursor-pointer hover:shadow-lg transition-shadow',
        },
        allowBase64: true,
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
          class: 'bg-muted/50 rounded-lg p-4 my-4 overflow-x-auto',
        },
      }),
      
      // Collapsible Details sections
      Details.configure({
        HTMLAttributes: {
          class: 'my-4 border border-border rounded-lg overflow-hidden',
        },
      }),
      DetailsContent.configure({
        HTMLAttributes: {
          class: 'p-4 bg-muted/20',
        },
      }),
      DetailsSummary.configure({
        HTMLAttributes: {
          class: 'p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors font-medium',
        },
      }),
      
      // Drag handle for reordering
      DragHandle.configure({
        HTMLAttributes: {
          class: 'drag-handle opacity-0 hover:opacity-100 transition-opacity',
        },
      }),
      
      // Emoji support
      Emoji.configure({
        enableEmoticons: true,
        suggestion: {
          items: ({ query }: { query: string }) => {
            const emojis = [
              '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
              '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
              '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
              '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
              '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
              '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
              '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
              '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
              '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
              '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
              '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
              '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
              '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
              '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️',
              '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
              '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴',
              '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐',
              '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑',
              '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢',
              '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕',
              '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱',
              '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐',
              '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️',
              '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦',
              '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙',
              '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣',
              '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️',
              '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️',
              '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️',
              '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄',
              '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱',
              '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝',
              '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣',
              '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳',
              '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨',
              '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊',
              '🔔', '🔕', '📣', '📢', '👁‍🗨', '💬', '💭', '🗯️', '♠️', '♣️',
              '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔',
              '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞',
              '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
            ];
            
            return emojis
              .filter(emoji => emoji.includes(query.toLowerCase()))
              .slice(0, 10);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(EmojiList, {
                  props,
                  editor: props.editor,
                });

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                component.updateProps(props);

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      
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
      
      // Mathematics support
      Mathematics.configure({
        HTMLAttributes: {
          class: 'math-node bg-muted/30 px-2 py-1 rounded mx-1',
        },
        katexOptions: {
          throwOnError: false,
          displayMode: false,
        },
      }),
      
      // Subscript and Superscript
      Subscript,
      Superscript,
      
      // Table support
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border my-4 w-full',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted/50 font-semibold',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border',
        },
      }),
      
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
        openSingleQuote: ''',
        closeSingleQuote: ''',
        ellipsis: '…',
        emDash: '—',
        enDash: '–',
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
      FloatingMenu.configure({
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
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4',
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
          editor?.chain().focus().setImage({ src: url, alt: file.name, title: file.name }).run();
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
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">:</kbd> Emoji</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd> Undo</span>
        </div>
      </motion.div>
    </div>
  );
};

// Emoji suggestion component
const EmojiList = React.forwardRef<any, any>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ emoji: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="glass-card border border-border/20 rounded-lg shadow-lg p-2 min-w-[200px] max-h-[200px] overflow-y-auto bg-background/95 backdrop-blur-md">
      {props.items.length ? (
        props.items.map((item: string, index: number) => (
          <button
            className={`w-full text-left p-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
              index === selectedIndex
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-muted/50 text-foreground border border-transparent'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <span className="text-lg">{item}</span>
          </button>
        ))
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Smile className="w-6 h-6 mx-auto mb-2 opacity-50" />
          No emojis found
        </div>
      )}
    </div>
  );
});

EmojiList.displayName = 'EmojiList';

export default JournalEditor;
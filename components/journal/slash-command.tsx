"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Minus,
  CheckSquare,
  Youtube,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';

interface SlashCommandProps {
  editor: Editor;
  range: any;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  command: () => void;
  keywords: string[];
  category: string;
}

export interface SlashCommandRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const SlashCommand = forwardRef<SlashCommandRef, SlashCommandProps>(
  ({ editor, range, menuRef }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [query, setQuery] = useState('');

    const commands: CommandItem[] = [
      // Basic blocks
      {
        title: 'Text',
        description: 'Just start typing with plain text.',
        icon: Type,
        command: () => {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        },
        keywords: ['text', 'paragraph', 'p'],
        category: 'Basic',
      },
      {
        title: 'Heading 1',
        description: 'Big section heading.',
        icon: Heading1,
        command: () => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
        keywords: ['heading', 'h1', 'title'],
        category: 'Basic',
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading.',
        icon: Heading2,
        command: () => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
        keywords: ['heading', 'h2', 'subtitle'],
        category: 'Basic',
      },
      {
        title: 'Heading 3',
        description: 'Small section heading.',
        icon: Heading3,
        command: () => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
        keywords: ['heading', 'h3'],
        category: 'Basic',
      },

      // Lists
      {
        title: 'Bullet List',
        description: 'Create a simple bullet list.',
        icon: List,
        command: () => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
        keywords: ['list', 'bullet', 'ul'],
        category: 'Lists',
      },
      {
        title: 'Numbered List',
        description: 'Create a list with numbering.',
        icon: ListOrdered,
        command: () => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
        keywords: ['list', 'numbered', 'ordered', 'ol'],
        category: 'Lists',
      },
      {
        title: 'Task List',
        description: 'Create a checklist.',
        icon: CheckSquare,
        command: () => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
        keywords: ['task', 'todo', 'checklist', 'checkbox'],
        category: 'Lists',
      },

      // Content blocks
      {
        title: 'Quote',
        description: 'Capture a quote.',
        icon: Quote,
        command: () => {
          editor.chain().focus().deleteRange(range).setBlockquote().run();
        },
        keywords: ['quote', 'blockquote'],
        category: 'Content',
      },
      {
        title: 'Code Block',
        description: 'Capture a code snippet.',
        icon: Code,
        command: () => {
          editor.chain().focus().deleteRange(range).setCodeBlock().run();
        },
        keywords: ['code', 'codeblock'],
        category: 'Content',
      },
      // Media
      {
        title: 'Image',
        description: 'Upload an image.',
        icon: Image,
        command: () => {
          editor.chain().focus().deleteRange(range).run();
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const url = e.target?.result as string;
                editor.chain().focus().setImage({ src: url, alt: file.name }).run();
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        },
        keywords: ['image', 'photo', 'picture', 'upload'],
        category: 'Media',
      },
      {
        title: 'YouTube',
        description: 'Embed a YouTube video.',
        icon: Youtube,
        command: () => {
          const url = prompt('Enter YouTube URL:');
          if (url) {
            editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: url }).run();
          }
        },
        keywords: ['youtube', 'video', 'embed'],
        category: 'Media',
      },
      {
        title: 'Divider',
        description: 'Visually divide blocks.',
        icon: Minus,
        command: () => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
        keywords: ['divider', 'hr', 'rule', 'line'],
        category: 'Advanced',
      },

      // Alignment
      {
        title: 'Align Left',
        description: 'Align text to the left.',
        icon: AlignLeft,
        command: () => {
          editor.chain().focus().deleteRange(range).setTextAlign('left').run();
        },
        keywords: ['align', 'left'],
        category: 'Alignment',
      },
      {
        title: 'Align Center',
        description: 'Center align text.',
        icon: AlignCenter,
        command: () => {
          editor.chain().focus().deleteRange(range).setTextAlign('center').run();
        },
        keywords: ['align', 'center'],
        category: 'Alignment',
      },
      {
        title: 'Align Right',
        description: 'Align text to the right.',
        icon: AlignRight,
        command: () => {
          editor.chain().focus().deleteRange(range).setTextAlign('right').run();
        },
        keywords: ['align', 'right'],
        category: 'Alignment',
      },
      {
        title: 'Justify',
        description: 'Justify text alignment.',
        icon: AlignJustify,
        command: () => {
          editor.chain().focus().deleteRange(range).setTextAlign('justify').run();
        },
        keywords: ['align', 'justify'],
        category: 'Alignment',
      },
    ];

    const filteredCommands = commands.filter(command =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.keywords.some(keyword => keyword.includes(query.toLowerCase())) ||
      command.category.toLowerCase().includes(query.toLowerCase())
    );

    // Group commands by category
    const groupedCommands = filteredCommands.reduce((acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    }, {} as Record<string, CommandItem[]>);

    const selectItem = (index: number) => {
      const command = filteredCommands[index];
      if (command) {
        command.command();
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
          return true;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          selectItem(selectedIndex);
          return true;
        }

        if (event.key === 'Escape') {
          return false;
        }

        return false;
      },
    }));

    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
      if (editor && range) {
        try {
          const text = editor.state.doc.textBetween(range.from, range.to, '');
          setQuery(text.slice(1)); // Remove the '/' character
        } catch (error) {
          console.warn('Error extracting query from range:', error);
          setQuery('');
        }
      }
    }, [editor, range]);

    useEffect(() => {
      if (menuRef.current) {
        const selectedItem = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedItem) {
          selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, [selectedIndex]);

    return (
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="glass-card border border-border/20 rounded-lg shadow-lg p-2 min-w-[300px] max-w-[400px] max-h-[300px] overflow-y-auto"
      >
        {Object.keys(groupedCommands).length > 0 ? (
          Object.entries(groupedCommands).map(([category, categoryCommands]) => (
            <div key={category} className="mb-3 last:mb-0">
              <div className="text-xs text-muted-foreground mb-2 px-2 font-medium uppercase tracking-wide">
                {category}
              </div>
              <div className="space-y-1">
                {categoryCommands.map((command, categoryIndex) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  return (
                    <motion.button
                      key={command.title}
                      data-index={globalIndex}
                      className={`w-full text-left p-3 rounded-md transition-all duration-200 flex items-center space-x-3 ${globalIndex === selectedIndex
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-muted/50 text-foreground border border-transparent'
                        }`}
                      onClick={() => selectItem(globalIndex)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center ${globalIndex === selectedIndex ? 'bg-primary/20' : 'bg-muted/30'
                          }`}
                      >
                        <command.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{command.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {command.description}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No matching commands
            {query && (
              <div className="text-xs mt-1">
                Try searching for: text, heading, list, image
              </div>
            )}
          </div>
        )}

        {/* Help text */}
        <div className="border-t border-border/20 mt-2 pt-2 text-xs text-muted-foreground px-2">
          <div className="flex items-center justify-between">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </motion.div>
    );
  }
);

SlashCommand.displayName = 'SlashCommand';

export default SlashCommand;
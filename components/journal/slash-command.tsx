"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Table,
  Youtube,
  Calculator
} from 'lucide-react';

interface SlashCommandProps {
  editor: Editor;
  range: any;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  command: () => void;
  keywords: string[];
}

export interface SlashCommandRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const SlashCommand = forwardRef<SlashCommandRef, SlashCommandProps>(
  ({ editor, range }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [query, setQuery] = useState('');

    const commands: CommandItem[] = [
      {
        title: 'Text',
        description: 'Just start typing with plain text.',
        icon: Type,
        command: () => {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        },
        keywords: ['text', 'paragraph', 'p'],
      },
      {
        title: 'Heading 1',
        description: 'Big section heading.',
        icon: Heading1,
        command: () => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
        keywords: ['heading', 'h1', 'title'],
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading.',
        icon: Heading2,
        command: () => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
        keywords: ['heading', 'h2', 'subtitle'],
      },
      {
        title: 'Heading 3',
        description: 'Small section heading.',
        icon: Heading3,
        command: () => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
        keywords: ['heading', 'h3'],
      },
      {
        title: 'Bullet List',
        description: 'Create a simple bullet list.',
        icon: List,
        command: () => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
        keywords: ['list', 'bullet', 'ul'],
      },
      {
        title: 'Numbered List',
        description: 'Create a list with numbering.',
        icon: ListOrdered,
        command: () => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
        keywords: ['list', 'numbered', 'ordered', 'ol'],
      },
      {
        title: 'Task List',
        description: 'Create a checklist.',
        icon: CheckSquare,
        command: () => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
        keywords: ['task', 'todo', 'checklist', 'checkbox'],
      },
      {
        title: 'Quote',
        description: 'Capture a quote.',
        icon: Quote,
        command: () => {
          editor.chain().focus().deleteRange(range).setBlockquote().run();
        },
        keywords: ['quote', 'blockquote'],
      },
      {
        title: 'Code Block',
        description: 'Capture a code snippet.',
        icon: Code,
        command: () => {
          editor.chain().focus().deleteRange(range).setCodeBlock().run();
        },
        keywords: ['code', 'codeblock'],
      },
      {
        title: 'Table',
        description: 'Insert a table.',
        icon: Table,
        command: () => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
        keywords: ['table', 'grid'],
      },
      {
        title: 'Math',
        description: 'Insert mathematical notation.',
        icon: Calculator,
        command: () => {
          editor.chain().focus().deleteRange(range).setMath({ latex: 'E = mc^2' }).run();
        },
        keywords: ['math', 'latex', 'equation'],
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
      },
      {
        title: 'Divider',
        description: 'Visually divide blocks.',
        icon: Minus,
        command: () => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
        keywords: ['divider', 'hr', 'rule', 'line'],
      },
    ];

    const filteredCommands = commands.filter(command =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.keywords.some(keyword => keyword.includes(query.toLowerCase()))
    );

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

    // Extract query from the range
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

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="glass-card border border-border/20 rounded-lg shadow-lg p-2 min-w-[320px] max-w-[400px] max-h-[300px] overflow-y-auto bg-background/95 backdrop-blur-md"
      >
        <div className="text-xs text-muted-foreground mb-2 px-2 font-medium">
          Basic blocks
        </div>
        <div className="space-y-1">
          {filteredCommands.map((command, index) => (
            <motion.button
              key={command.title}
              className={`w-full text-left p-3 rounded-md transition-all duration-200 flex items-center space-x-3 ${
                index === selectedIndex
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-muted/50 text-foreground border border-transparent'
              }`}
              onClick={() => selectItem(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  index === selectedIndex ? 'bg-primary/20' : 'bg-muted/30'
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
          ))}
        </div>
        {filteredCommands.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No matching commands
          </div>
        )}
      </motion.div>
    );
  }
);

SlashCommand.displayName = 'SlashCommand';

export default SlashCommand;
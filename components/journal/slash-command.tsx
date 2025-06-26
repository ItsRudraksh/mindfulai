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
  CheckSquare
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
        title: 'Quote',
        description: 'Capture a quote.',
        icon: Quote,
        command: () => {
          editor.chain().focus().deleteRange(range).setBlockquote().run();
        },
        keywords: ['quote', 'blockquote'],
      },
      {
        title: 'Code',
        description: 'Capture a code snippet.',
        icon: Code,
        command: () => {
          editor.chain().focus().deleteRange(range).setCodeBlock().run();
        },
        keywords: ['code', 'codeblock'],
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
          setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
          return true;
        }

        if (event.key === 'Enter') {
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
      const text = editor.state.doc.textBetween(range.from, range.to, '');
      setQuery(text.slice(1)); // Remove the '/' character
    }, [editor, range]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="glass-card border border-border/20 rounded-lg shadow-lg p-2 min-w-[300px] max-w-[400px] max-h-[300px] overflow-y-auto"
      >
        <div className="text-xs text-muted-foreground mb-2 px-2">
          Basic blocks
        </div>
        <div className="space-y-1">
          {filteredCommands.map((command, index) => (
            <motion.button
              key={command.title}
              className={`w-full text-left p-2 rounded-md transition-colors duration-200 flex items-center space-x-3 ${index === selectedIndex
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted/50 text-foreground'
                }`}
              onClick={() => selectItem(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${index === selectedIndex ? 'bg-primary/20' : 'bg-muted/30'
                }`}>
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
          <div className="text-center py-4 text-muted-foreground text-sm">
            No matching commands
          </div>
        )}
      </motion.div>
    );
  }
);

SlashCommand.displayName = 'SlashCommand';

export default SlashCommand;
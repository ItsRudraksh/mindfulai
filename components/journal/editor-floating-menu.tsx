"use client";

import React from 'react';
import { Editor } from '@tiptap/react';
import { FloatingMenu } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  CheckSquare,
  Image as ImageIcon,
  Youtube as YoutubeIcon
} from 'lucide-react';

interface EditorFloatingMenuProps {
  editor: Editor;
}

const EditorFloatingMenu: React.FC<EditorFloatingMenuProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <FloatingMenu
      className="flex flex-col gap-1 p-1 rounded-md shadow-md bg-background border border-border"
      editor={editor}
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor }) => {
        return editor.isEmpty;
      }}
    >
      <Button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`p-2 h-auto ${editor.isActive('paragraph') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Type className="h-4 w-4" />
        <span className="ml-2">Paragraph</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
        className={`p-2 h-auto ${editor.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Heading1 className="h-4 w-4" />
        <span className="ml-2">Heading 1</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
        className={`p-2 h-auto ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Heading2 className="h-4 w-4" />
        <span className="ml-2">Heading 2</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
        className={`p-2 h-auto ${editor.isActive('heading', { level: 3 }) ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Heading3 className="h-4 w-4" />
        <span className="ml-2">Heading 3</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 h-auto ${editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <List className="h-4 w-4" />
        <span className="ml-2">Bullet List</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 h-auto ${editor.isActive('orderedList') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <ListOrdered className="h-4 w-4" />
        <span className="ml-2">Numbered List</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().setBlockquote().run()}
        className={`p-2 h-auto ${editor.isActive('blockquote') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Quote className="h-4 w-4" />
        <span className="ml-2">Quote</span>
      </Button>
      <Button
        onClick={() => editor.chain().focus().setCodeBlock().run()}
        className={`p-2 h-auto ${editor.isActive('codeBlock') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Code className="h-4 w-4" />
        <span className="ml-2">Code Block</span>
      </Button>
      {/* You can add more buttons here for other block types like images, videos, etc. */}
    </FloatingMenu>
  );
};

export default EditorFloatingMenu; 
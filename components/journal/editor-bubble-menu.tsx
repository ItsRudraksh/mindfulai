"use client";

import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react';
import { Bold, Italic, Link, Unlink, Code, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EditorBubbleMenuProps {
  editor: Editor;
}

const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu className="flex gap-1 p-1 rounded-md shadow-md bg-background border border-border" editor={editor} tippyOptions={{ duration: 100 }}>
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 h-auto ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 h-auto ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={`p-2 h-auto ${editor.isActive('link') ? 'bg-accent text-accent-foreground' : ''}`}
            variant="ghost"
            size="sm"
          >
            <Link className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <div className="flex items-center p-2">
            <Input
              type="url"
              placeholder="Enter URL"
              defaultValue={editor.getAttributes('link').href || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const url = (e.target as HTMLInputElement).value;
                  if (url === '') {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  } else {
                    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                  }
                  // Close popover
                  e.currentTarget.blur();
                }
              }}
              className="text-sm"
            />
            {editor.isActive('link') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().unsetLink().run()}
                className="ml-2 p-2 h-auto"
              >
                <Unlink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`p-2 h-auto ${editor.isActive('code') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={!editor.can().chain().focus().toggleHighlight().run()}
        className={`p-2 h-auto ${editor.isActive('highlight') ? 'bg-accent text-accent-foreground' : ''}`}
        variant="ghost"
        size="sm"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
    </BubbleMenu>
  );
};

export default EditorBubbleMenu; 
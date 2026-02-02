import React, { useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Box, IconButton, Divider } from '@mui/material';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatStrikethrough,
  MdTitle,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdCode,
  MdHorizontalRule,
  MdImage,
} from 'react-icons/md';

/**
 * TipTap 리치 텍스트 에디터 컴포넌트
 * @param {string} initialValue - 초기 HTML 콘텐츠
 * @param {function} onChange - 콘텐츠 변경 시 호출 (html) => void
 * @param {string} placeholder - 플레이스홀더 텍스트
 * @param {number} height - 에디터 높이 (px)
 * @param {function} onImageUpload - 이미지 업로드 핸들러 (file) => Promise<string> (URL 또는 base64 반환)
 * @param {object} editorRef - 외부에서 editor 인스턴스에 접근하기 위한 ref
 */
function TipTapEditor({
  initialValue = '',
  onChange,
  placeholder = '내용을 입력해주세요.',
  height = 400,
  onImageUpload,
  editorRef: externalEditorRef,
}) {
  const editorInstanceRef = useRef(null);
  const handleImageUpload = useCallback(
    async (file) => {
      if (onImageUpload) {
        return onImageUpload(file);
      }
      // base64 기본 처리 (Settings 페이지 등)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    [onImageUpload]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialValue || '',
    editorProps: {
      attributes: {
        style: `min-height: ${height}px;`,
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              event.preventDefault();
              handleImageUpload(file).then((src) => {
                if (src) {
                  editorInstanceRef.current?.chain().focus().setImage({ src }).run();
                }
              });
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageUpload(file).then((src) => {
            if (src) {
              editorInstanceRef.current?.chain().focus().setImage({ src }).run();
            }
          });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // ref에 editor 저장 (handlePaste/handleDrop 등에서 사용)
  editorInstanceRef.current = editor;

  // external ref에 editor 전달
  useEffect(() => {
    if (externalEditorRef) {
      externalEditorRef.current = editor;
    }
    return () => {
      if (externalEditorRef) {
        externalEditorRef.current = null;
      }
    };
  }, [editor, externalEditorRef]);

  // initialValue 변경 시 내용 업데이트 (편집 모드 - API에서 데이터 로드 시)
  useEffect(() => {
    if (!editor || !initialValue) return;
    const html = editor.getHTML();
    const isEmpty = html === '' || html === '<p></p>' || html === '<p><br></p>';
    if (isEmpty && initialValue.trim() !== '') {
      editor.commands.setContent(initialValue, false);
    }
  }, [editor, initialValue]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: 1,
        overflow: 'hidden',
        '& .tiptap': {
          minHeight: height,
          padding: 2,
          outline: 'none',
          '& p.is-editor-empty:first-child::before': {
            content: `attr(data-placeholder)`,
            float: 'left',
            color: '#9ca3af',
            pointerEvents: 'none',
            height: 0,
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1,
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline',
          },
        },
      }}
      aria-label="텍스트 편집기"
      role="textbox"
    >
      <TipTapMenuBar editor={editor} onImageUpload={handleImageUpload} />
      <EditorContent editor={editor} />
    </Box>
  );
}

// 툴바 메뉴
function TipTapMenuBar({ editor, onImageUpload }) {
  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target?.files?.[0];
      if (!file || !onImageUpload) return;
      const src = await onImageUpload(file);
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    input.click();
  };

  if (!editor) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 0.25,
        p: 0.5,
        borderBottom: '1px solid #e5e7eb',
        bgcolor: 'grey.50',
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 4 },
      }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="굵게"
      >
        <MdFormatBold size={20} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="기울임"
      >
        <MdFormatItalic size={20} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="취소선"
      >
        <MdFormatStrikethrough size={20} />
      </ToolbarButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'divider' }} />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      >
        <MdTitle size={20} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      >
        <Box component="span" sx={{ fontSize: 16, fontWeight: 700 }}>H2</Box>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      >
        <Box component="span" sx={{ fontSize: 14, fontWeight: 600 }}>H3</Box>
      </ToolbarButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'divider' }} />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="글머리 기호"
      >
        <MdFormatListBulleted size={20} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="번호 매기기"
      >
        <MdFormatListNumbered size={20} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="인용"
      >
        <MdFormatQuote size={20} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="코드 블록"
      >
        <MdCode size={20} />
      </ToolbarButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'divider' }} />
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
        <MdHorizontalRule size={20} />
      </ToolbarButton>
      {onImageUpload && (
        <ToolbarButton onClick={addImage} title="이미지 삽입">
          <MdImage size={20} />
        </ToolbarButton>
      )}
    </Box>
  );
}

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      sx={{
        color: active ? 'primary.main' : 'text.secondary',
        bgcolor: active ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: active ? 'action.selected' : 'action.hover',
        },
      }}
    >
      {children}
    </IconButton>
  );
}

export default TipTapEditor;

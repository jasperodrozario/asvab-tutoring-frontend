'use client';

import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditorBase from '@ckeditor/ckeditor5-build-classic';

interface CKEditorFieldProps {
  value?: string;
  onChange?: (data: string) => void;
  placeholder?: string;
  height?: string;
}

const CKEditorField: React.FC<CKEditorFieldProps> = ({
  value = '',
  onChange,
  placeholder,
  height = '300px'
}) => {
  const [editorData, setEditorData] = useState(value);

  return (
    <CKEditor
      // Temporary fix: allow any type for the editor to pass TS build
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor={ClassicEditorBase as unknown as any}
      data={editorData}
      config={{
        placeholder: placeholder || 'Start typing...',
        toolbar: [
          'bold', 'italic', 'underline', 'highlight', 'fontColor', 'fontBackgroundColor', 'fontSize', '|',
          'bulletedList', 'numberedList', 'alignment', '|',
          'insertTable', 'link', 'imageUpload', 'mediaEmbed', '|',
          'blockQuote', 'undo', 'redo', '|',
          'codeBlock', 'math', 'sourceEditing'
        ],
       
      }}
      onReady={(editor) => {
        if (editor.ui.view.editable.element) {
          editor.ui.view.editable.element.style.height = height;
          editor.ui.view.editable.element.style.overflowY = 'auto';
        }
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        setEditorData(data);
        onChange?.(data);
      }}
    />
  );
};

export default CKEditorField;

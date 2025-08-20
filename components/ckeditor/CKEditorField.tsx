'use client';

import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface CKEditorFieldProps {
  value?: string;
  onChange?: (data: string) => void;
  placeholder?: string;
}

const CKEditorField: React.FC<CKEditorFieldProps> = ({ value = '', onChange, placeholder }) => {
  const [editorData, setEditorData] = useState(value);

  return (
    <CKEditor
      editor={ClassicEditor}
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
        fontSize: {
          options: ['tiny', 'small', 'default', 'big', 'huge']
        },
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

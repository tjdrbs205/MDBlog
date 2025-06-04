import { useRef } from "react";
import { useCKEditor } from "../hooks/useCKEditor";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { useAuthContext } from "../context/AuthContext";

interface CKEditorComponentProps {
  value?: string;
  onChange?: (data: string) => void;
  placeholder?: string;
}

const CKEditorComponent: React.FC<CKEditorComponentProps> = ({
  value = "",
  onChange,
  placeholder = "내용을 입력하세요...",
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuthContext();
  const { ClassicEditor, editorConfig, isReady } = useCKEditor(accessToken);

  if (!isReady || !ClassicEditor || !editorConfig) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </div>
      </div>
    );
  }

  const finalConfig = {
    ...editorConfig,
    placeholder: placeholder || editorConfig?.placeholder,
    initialData: value,
  };

  return (
    <div className="w-100">
      <div className="editor-container editor-container_classic-editor" ref={editorContainerRef}>
        <div className="editor-container__editor">
          <div ref={editorRef}>
            <CKEditor
              editor={ClassicEditor}
              config={finalConfig}
              data={value}
              onChange={(event, editor) => {
                const data = editor.getData();
                onChange?.(data);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CKEditorComponent;

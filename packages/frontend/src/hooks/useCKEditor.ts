import { useState, useEffect, useMemo } from "react";
import { useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import { createUploadAdapterPlugin } from "../utils/CKEditorAdapter";

const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY;

export const useCKEditor = (accessToken: string | null) => {
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const cloud = useCKEditorCloud({ version: "45.1.0", translations: ["ko"] });

  useEffect(() => {
    setIsLayoutReady(true);
    return () => setIsLayoutReady(false);
  }, []);

  const editorData = useMemo(() => {
    if (cloud.status !== "success" || !isLayoutReady) {
      return {
        ClassicEditor: null,
        editorConfig: null,
      };
    }

    const {
      ClassicEditor,
      Autoformat,
      AutoImage,
      Autosave,
      BalloonToolbar,
      BlockQuote,
      Bold,
      CloudServices,
      CodeBlock,
      Emoji,
      Essentials,
      Heading,
      ImageBlock,
      ImageCaption,
      ImageInline,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Italic,
      Link,
      LinkImage,
      List,
      ListProperties,
      MediaEmbed,
      Mention,
      Paragraph,
      PasteFromOffice,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      TextTransformation,
      TodoList,
      Underline,
    } = cloud.CKEditor;

    return {
      ClassicEditor,
      editorConfig: {
        toolbar: {
          items: [
            "undo",
            "redo",
            "|",
            "heading",
            "|",
            "bold",
            "italic",
            "underline",
            "|",
            "imageInsert",
            "|",
            "emoji",
            "link",
            "mediaEmbed",
            "insertTable",
            "blockQuote",
            "codeBlock",
            "|",
            "bulletedList",
            "numberedList",
            "todoList",
            "outdent",
            "indent",
          ],
          shouldNotGroupWhenFull: false,
        },
        plugins: [
          Autoformat,
          AutoImage,
          Autosave,
          BalloonToolbar,
          BlockQuote,
          Bold,
          CloudServices,
          CodeBlock,
          Emoji,
          Essentials,
          Heading,
          ImageBlock,
          ImageCaption,
          ImageInline,
          ImageInsertViaUrl,
          ImageResize,
          ImageStyle,
          ImageTextAlternative,
          ImageToolbar,
          ImageUpload,
          Indent,
          IndentBlock,
          Italic,
          Link,
          LinkImage,
          List,
          ListProperties,
          MediaEmbed,
          Mention,
          Paragraph,
          PasteFromOffice,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableProperties,
          TableToolbar,
          TextTransformation,
          TodoList,
          Underline,
          createUploadAdapterPlugin(accessToken!),
        ],
        balloonToolbar: [
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "|",
          "imageInsert",
          "|",
          "emoji",
          "link",
          "mediaEmbed",
          "insertTable",
          "blockQuote",
          "codeBlock",
          "|",
          "bulletedList",
          "numberedList",
          "todoList",
          "outdent",
          "indent",
        ],
        heading: {
          options: [
            {
              model: "paragraph" as const,
              title: "Paragraph",
              class: "ck-heading_paragraph",
            },
            {
              model: "heading1" as const,
              view: "h1" as const,
              title: "Heading 1",
              class: "ck-heading_heading1",
            },
            {
              model: "heading2" as const,
              view: "h2" as const,
              title: "Heading 2",
              class: "ck-heading_heading2",
            },
            {
              model: "heading3" as const,
              view: "h3" as const,
              title: "Heading 3",
              class: "ck-heading_heading3",
            },
            {
              model: "heading4" as const,
              view: "h4" as const,
              title: "Heading 4",
              class: "ck-heading_heading4",
            },
            {
              model: "heading5" as const,
              view: "h5" as const,
              title: "Heading 5",
              class: "ck-heading_heading5",
            },
            {
              model: "heading6" as const,
              view: "h6" as const,
              title: "Heading 6",
              class: "ck-heading_heading6",
            },
          ],
        },
        image: {
          toolbar: [
            "toggleImageCaption",
            "imageTextAlternative",
            "|",
            "imageStyle:inline",
            "imageStyle:wrapText",
            "imageStyle:breakText",
            "|",
            "resizeImage",
          ],
        },
        language: "ko",
        licenseKey: LICENSE_KEY,
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: "https://",
          decorators: {
            toggleDownloadable: {
              mode: "manual" as const,
              label: "Downloadable",
              attributes: { download: "file" },
            },
          },
        },
        list: {
          properties: {
            styles: true,
            startIndex: true,
            reversed: true,
          },
        },
        mention: {
          feeds: [{ marker: "@", feed: [] }],
        },
        placeholder: "내용을 입력하세요...",
        table: {
          contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties",
          ],
        },
      },
    };
  }, [cloud, isLayoutReady, accessToken]);

  return {
    ...editorData,
    isReady: cloud.status === "success" && isLayoutReady && !!editorData.ClassicEditor,
  };
};

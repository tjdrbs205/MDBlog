/**
 * MDBlog 공통 JavaScript 기능
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("MDBlog 공통 스크립트 로드됨");

  // 5초 후 자동으로 알림 닫기
  setTimeout(function () {
    const alerts = document.querySelectorAll(".alert");
    alerts.forEach(function (alert) {
      if (bootstrap && bootstrap.Alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    });
  }, 5000);

  // 드롭다운 메뉴 수동 초기화
  var dropdownElementList = [].slice.call(document.querySelectorAll(".dropdown-toggle"));
  dropdownElementList.forEach(function (dropdownToggleEl) {
    if (bootstrap && bootstrap.Dropdown) {
      new bootstrap.Dropdown(dropdownToggleEl);
    }
  });

  // 추가적인 드롭다운 기능 처리
  document.querySelectorAll(".dropdown-toggle").forEach(function (element) {
    element.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // 클릭된 요소의 다음 형제 요소 (드롭다운 메뉴)를 토글
      var dropdownMenu = this.nextElementSibling;
      if (dropdownMenu.classList.contains("show")) {
        dropdownMenu.classList.remove("show");
      } else {
        // 다른 열린 드롭다운 메뉴 닫기
        document.querySelectorAll(".dropdown-menu.show").forEach(function (menu) {
          menu.classList.remove("show");
        });
        dropdownMenu.classList.add("show");
      }
    });
  });

  // 드롭다운 외부 클릭 시 닫기
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-menu.show").forEach(function (menu) {
        menu.classList.remove("show");
      });
    }
  });
});

// AJAX CSRF 설정 (jQuery)
function setupCsrfForAjax() {
  if (typeof $ !== "undefined") {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

    if (csrfToken) {
      $.ajaxSetup({
        headers: {
          "CSRF-Token": csrfToken,
        },
      });
    }
  }
}

// 페이지 로드 시 CSRF 설정 실행
document.addEventListener("DOMContentLoaded", setupCsrfForAjax);

/**
 * CKEditor 이미지 업로드 어댑터 클래스
 */
class ImageUploadAdapter {
  constructor(loader) {
    // CKEditor 파일 로더 인스턴스 저장
    this.loader = loader;
  }

  // 업로드 시작 메서드
  upload() {
    return this.loader.file.then((file) => {
      // FormData 객체 생성
      const formData = new FormData();
      formData.append("image", file);

      // CSRF 토큰 가져오기
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

      // 서버로 이미지 업로드 요청 (수정된 엔드포인트 사용)
      return fetch("/api/upload/ckeditor", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: csrfToken ? { "CSRF-Token": csrfToken } : {},
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("이미지 업로드 중 오류가 발생했습니다.");
          }
          return response.json();
        })
        .then((data) => {
          // 업로드 성공 시 URL 반환
          return {
            default: data.url,
            // 필요한 경우 추가 이미지 크기 URL 제공
            // '500': data.url500,
            // '1000': data.url1000,
          };
        });
    });
  }

  // 업로드 취소 (abort) 메서드
  abort() {
    // 업로드 취소 로직 (필요시 구현)
    console.log("이미지 업로드가 취소되었습니다.");
    return Promise.resolve();
  }
}

// 이미지 업로드 어댑터 플러그인 함수
function ImageUploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new ImageUploadAdapter(loader);
  };
}

// CKEditor 5 Classic Editor
const {
  ClassicEditor,
  Autoformat,
  AutoImage,
  Autosave,
  BlockQuote,
  Bold,
  CloudServices,
  CodeBlock,
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
  SourceEditing,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline,
} = window.CKEDITOR;

// 서버에서 전달받은 라이센스 키 사용
const LICENSE_KEY = window.CKEDITOR_LICENSE_KEY || "";

const editorConfig = {
  toolbar: {
    items: [
      "sourceEditing",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "underline",
      "|",
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
      "|",
      "imageUpload", // 이미지 업로드 버튼 추가
      "|",
    ],
    shouldNotGroupWhenFull: false,
  },
  plugins: [
    Autoformat,
    AutoImage,
    Autosave,
    BlockQuote,
    Bold,
    CloudServices,
    CodeBlock,
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
    SourceEditing,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    TodoList,
    Underline,
  ],
  extraPlugins: [ImageUploadAdapterPlugin], // 커스텀 이미지 업로드 어댑터 추가
  heading: {
    options: [
      {
        model: "paragraph",
        view: "p",
        title: "본문",
        class: "ck-heading_paragraph",
      },
      {
        model: "heading1",
        view: "h1",
        title: "Heading 1",
        class: "ck-heading_heading1",
      },
      {
        model: "heading2",
        view: "h2",
        title: "Heading 2",
        class: "ck-heading_heading2",
      },
      {
        model: "heading3",
        view: "h3",
        title: "Heading 3",
        class: "ck-heading_heading3",
      },
      {
        model: "heading4",
        view: "h4",
        title: "Heading 4",
        class: "ck-heading_heading4",
      },
      {
        model: "heading5",
        view: "h5",
        title: "Heading 5",
        class: "ck-heading_heading5",
      },
      {
        model: "heading6",
        view: "h6",
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
    // 이미지 업로드 설정
    upload: {
      types: ["jpeg", "png", "gif", "bmp", "webp", "jpg"],
    },
  },
  language: "ko",
  licenseKey: LICENSE_KEY,
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
    decorators: {
      toggleDownloadable: {
        mode: "manual",
        label: "Downloadable",
        attributes: {
          download: "file",
        },
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
    feeds: [
      {
        marker: "@",
        feed: [
          { id: "@admin", name: "관리자" },
          { id: "@user", name: "사용자" },
          { id: "@guest", name: "손님" },
        ],
      },
    ],
  },
  placeholder: "내용을 입력하세요...",
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
  },
};

// DOM이 로드된 후 에디터 초기화
document.addEventListener("DOMContentLoaded", () => {
  const editorElement = document.querySelector("#editor");
  if (editorElement) {
    ClassicEditor.create(editorElement, editorConfig)
      .then((editor) => {
        console.log("CKEditor가 초기화되었습니다.");
        window.editor = editor;
      })
      .catch((error) => {
        console.error("CKEditor 초기화 중 오류 발생:", error);
      });
  }

  // 페이지에 있는 코드 블록에 Prism.js 적용
  if (typeof Prism !== "undefined") {
    // Prism.js가 로드된 경우에만 실행
    Prism.highlightAll();
    console.log("Prism.js 코드 하이라이트 적용됨");
  }
});

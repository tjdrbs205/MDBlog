/**
 * MDBlog 게시글 작성/편집 관련 JavaScript 기능
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("게시글 관리 스크립트 로드됨");

  // 태그 관리 기능
  initTagsManager();

  // 리치 텍스트 에디터 초기화 (필요시 활성화)
  // initRichTextEditor();
});

/**
 * 태그 관리 기능 초기화
 */
function initTagsManager() {
  // 태그 목록에서 태그 클릭 시 입력 필드에 추가
  const tagItems = document.querySelectorAll(".tag-item");
  const tagsInput = document.getElementById("tags");

  if (tagItems.length > 0 && tagsInput) {
    tagItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        const tagName = this.getAttribute("data-tag");

        // 현재 입력된 태그 가져오기
        let currentTags = tagsInput.value
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== "");

        // 이미 존재하는 태그인지 확인
        if (!currentTags.includes(tagName)) {
          if (currentTags.length > 0) {
            tagsInput.value += ", " + tagName;
          } else {
            tagsInput.value = tagName;
          }
        }
      });
    });
  }
}

/**
 * 리치 텍스트 에디터 초기화 (필요시 구현)
 */
function initRichTextEditor() {
  const contentEditor = document.getElementById("content");
  if (contentEditor) {
    // 여기에 리치 텍스트 에디터 초기화 코드 추가 가능
    console.log("에디터 통합 준비됨");
  }
}

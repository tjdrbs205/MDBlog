// 카테고리 토글 기능
document.addEventListener("DOMContentLoaded", function () {
  console.log("Category toggle script loaded");

  // 모든 토글 버튼에 이벤트 리스너 추가
  const toggleButtons = document.querySelectorAll(".toggle-btn");

  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // 부모 li 요소 찾기
      const categoryItem = this.closest(".category-item");

      // 하위 카테고리 찾기
      const subCategories = categoryItem.querySelector(".sub-categories");

      // 아이콘 참조
      const icon = this.querySelector("i");

      // 토글
      if (subCategories.classList.contains("collapsed")) {
        // 닫힌 상태 -> 열기
        subCategories.classList.remove("collapsed");
        icon.classList.add("rotated");
      } else {
        // 열린 상태 -> 닫기
        subCategories.classList.add("collapsed");
        icon.classList.remove("rotated");
      }
    });
  });

  // 현재 선택된 카테고리에 해당하는 상위 카테고리들을 모두 펼쳐주기
  if (document.querySelector(".category-link.active")) {
    let activeItem = document.querySelector(".category-link.active").closest(".category-item");

    // 상위 카테고리 열기
    while (activeItem) {
      const parentSubCategories = activeItem.closest(".sub-categories");
      if (parentSubCategories) {
        // 상위 카테고리의 하위 메뉴 열기
        parentSubCategories.classList.remove("collapsed");

        // 상위 카테고리의 토글 버튼 아이콘 회전
        const parentItem = parentSubCategories.closest(".category-item");
        if (parentItem) {
          const toggleBtn = parentItem.querySelector(".toggle-btn");
          if (toggleBtn) {
            const icon = toggleBtn.querySelector("i");
            if (icon) {
              icon.classList.add("rotated");
            }
          }

          // 상위 항목으로 이동
          activeItem = parentItem;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }
});

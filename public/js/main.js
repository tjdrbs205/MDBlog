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
  if (typeof $ !== "undefined" && $('meta[name="csrf-token"]').length) {
    $.ajaxSetup({
      headers: {
        "CSRF-Token": $('meta[name="csrf-token"]').attr("content"),
      },
    });
  }
}

// 페이지 로드 시 CSRF 설정 실행
document.addEventListener("DOMContentLoaded", setupCsrfForAjax);

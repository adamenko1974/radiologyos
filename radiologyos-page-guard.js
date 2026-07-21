(function () {
  "use strict";

  function getPageName() {
    return (
      window.location.pathname.split("/").pop() ||
      "index.html"
    );
  }

  const pagePermissions = {
    "index.html": "dashboard",
    "executive-dashboard.html": "dashboard",

    "patients.html": "patients",
    "studies.html": "studies",
    "protocols.html": "protocols",
    "protocol-builder.html": "protocols",

    "archive.html": "archive",
    "knowledge.html": "knowledge",
    "ai.html": "ai",

    "contrast.html": "contrast",
    "dose-monitoring.html": "dose",

    "reports.html": "reports",
    "analytics.html": "analytics",
    "finance.html": "finance",

    "inventory.html": "inventory",
    "equipment.html": "equipment",
    "maintenance.html": "equipment",

    "staff.html": "staff",
    "schedule.html": "schedule",

    "referrals.html": "referrals",
    "checklists.html": "checklists",
    "daily-log.html": "daily-log",

    "audit.html": "audit",
    "settings.html": "settings",
    "data-center.html": "settings",

    "users.html": "settings",
    "permissions.html": "settings"
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function protectPage(permission) {
    if (!window.RadiologyAuth) {
      console.error(
        "radiologyos-auth.js не підключено"
      );

      window.location.replace("login.html");
      return false;
    }

    const requiredPermission =
      permission ||
      pagePermissions[getPageName()] ||
      "dashboard";

    return RadiologyAuth.requireAuth({
      permission: requiredPermission,
      deniedRedirect: "executive-dashboard.html"
    });
  }

  function renderCurrentUser(containerId) {
    const container =
      document.getElementById(
        containerId || "currentUser"
      );

    if (!container || !window.RadiologyAuth) {
      return;
    }

    const user =
      RadiologyAuth.getCurrentUser();

    if (!user) {
      return;
    }

    container.innerHTML = `
      <div class="ros-user-widget">
        <div class="ros-user-info">
          <strong>
            ${escapeHtml(user.fullName)}
          </strong>

          <span>
            ${escapeHtml(
              RadiologyAuth.getRoleName(user.role)
            )}
          </span>
        </div>

        <button
          type="button"
          class="ros-logout-button"
          onclick="RadiologyAuth.logout()"
        >
          Вийти
        </button>
      </div>
    `;
  }

  function hideUnauthorizedLinks() {
    if (!window.RadiologyAuth) {
      return;
    }

    document
      .querySelectorAll("[data-permission]")
      .forEach((element) => {
        const permission =
          element.dataset.permission;

        if (
          permission &&
          !RadiologyAuth.hasPermission(permission)
        ) {
          element.style.display = "none";
        }
      });
  }

  function injectStyles() {
    if (
      document.getElementById(
        "radiologyosGuardStyles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id = "radiologyosGuardStyles";

    style.textContent = `
      .ros-user-widget {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ros-user-info {
        text-align: right;
      }

      .ros-user-info strong {
        display: block;
        color: #172033;
        font-size: 13px;
      }

      .ros-user-info span {
        color: #667085;
        font-size: 11px;
      }

      .ros-logout-button {
        width: auto;
        padding: 8px 10px;
        border: none;
        border-radius: 7px;
        background: #fdecec;
        color: #b42318;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
      }

      @media (max-width: 600px) {
        .ros-user-info {
          display: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function initialize(options) {
    const settings = options || {};

    injectStyles();

    const allowed =
      protectPage(settings.permission);

    if (!allowed) {
      return false;
    }

    renderCurrentUser(
      settings.userContainerId ||
      "currentUser"
    );

    hideUnauthorizedLinks();

    return true;
  }

  window.RadiologyGuard = {
    pagePermissions,
    protectPage,
    renderCurrentUser,
    hideUnauthorizedLinks,
    initialize
  };
})();

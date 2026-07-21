(function () {
  "use strict";

  const USERS_KEY = "radiologyosUsers";
  const SESSION_KEY = "radiologyosSession";
  const AUTH_VERSION = 1;

  const defaultUsers = [
    {
      id: "USR-ADMIN",
      fullName: "Адміністратор RadiologyOS",
      email: "admin@radiologyos.local",
      password: "admin123",
      role: "admin",
      position: "Системний адміністратор",
      status: "Активний"
    },
    {
      id: "USR-HEAD",
      fullName: "Адаменко Д.М.",
      email: "head@radiologyos.local",
      password: "head123",
      role: "manager",
      position: "Керівник відділення",
      status: "Активний"
    },
    {
      id: "USR-DOCTOR",
      fullName: "Лікар-рентгенолог",
      email: "doctor@radiologyos.local",
      password: "doctor123",
      role: "doctor",
      position: "Лікар-рентгенолог",
      status: "Активний"
    },
    {
      id: "USR-TECH",
      fullName: "Клімов Л.В.",
      email: "tech@radiologyos.local",
      password: "tech123",
      role: "technician",
      position: "Рентгенлаборант",
      status: "Активний"
    },
    {
      id: "USR-NURSE",
      fullName: "Медична сестра",
      email: "nurse@radiologyos.local",
      password: "nurse123",
      role: "nurse",
      position: "Медична сестра",
      status: "Активний"
    }
  ];

  const rolePermissions = {
  admin: ["*"],

  manager: [
    "dashboard",
    "patients",
    "studies",
    "protocols",
    "reports",
    "analytics",
    "finance",
    "inventory",
    "equipment",
    "staff",
    "schedule",
    "audit",
    "settings",
    "crm",
    "tasks"
  ],

  doctor: [
    "dashboard",
    "patients",
    "studies",
    "protocols",
    "reports",
    "schedule",
    "crm",
    "tasks"
  ],

  technician: [
    "dashboard",
    "patients",
    "studies",
    "schedule",
    "equipment",
    "inventory",
    "crm",
    "tasks"
  ],

  nurse: [
    "dashboard",
    "patients",
    "studies",
    "schedule",
    "contrast",
    "inventory",
    "crm",
    "tasks"
  ]
};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initializeUsers() {
    try {
      const saved = localStorage.getItem(USERS_KEY);

      if (!saved) {
        localStorage.setItem(
          USERS_KEY,
          JSON.stringify(defaultUsers)
        );

        return clone(defaultUsers);
      }

      const users = JSON.parse(saved);

      if (!Array.isArray(users)) {
        throw new Error("Некоректний список користувачів");
      }

      return users;
    } catch (error) {
      console.error("Помилка авторизації:", error);

      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(defaultUsers)
      );

      return clone(defaultUsers);
    }
  }

  function getUsers() {
    return initializeUsers();
  }

  function saveUsers(users) {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify(users)
    );

    return true;
  }

  function findUserByEmail(email) {
    const normalizedEmail =
      String(email || "").trim().toLowerCase();

    return getUsers().find(
      user =>
        String(user.email || "").toLowerCase() ===
        normalizedEmail
    ) || null;
  }

  function login(email, password) {
    const user = findUserByEmail(email);

    if (!user) {
      return {
        success: false,
        message: "Користувача з таким email не знайдено."
      };
    }

    if (user.status !== "Активний") {
      return {
        success: false,
        message: "Обліковий запис заблоковано."
      };
    }

    if (String(user.password) !== String(password)) {
      return {
        success: false,
        message: "Неправильний пароль."
      };
    }

    const session = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      position: user.position,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );

    window.dispatchEvent(
      new CustomEvent("radiologyos:login", {
        detail: clone(session)
      })
    );

    return {
      success: true,
      user: clone(session)
    };
  }

  function logout(redirectToLogin) {
    localStorage.removeItem(SESSION_KEY);

    window.dispatchEvent(
      new CustomEvent("radiologyos:logout")
    );

    if (redirectToLogin !== false) {
      window.location.href = "login.html";
    }
  }

  function getSession() {
    try {
      const saved =
        localStorage.getItem(SESSION_KEY);

      if (!saved) {
        return null;
      }

      const session = JSON.parse(saved);

      if (
        !session ||
        !session.userId ||
        !session.role
      ) {
        return null;
      }

      const user = getUsers().find(
        item => item.id === session.userId
      );

      if (!user || user.status !== "Активний") {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return clone(session);
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function isAuthenticated() {
    return Boolean(getSession());
  }

  function getCurrentUser() {
    const session = getSession();

    if (!session) {
      return null;
    }

    const user = getUsers().find(
      item => item.id === session.userId
    );

    return user ? clone(user) : null;
  }

  function getRoleName(role) {
    return roleNames[role] || role || "Користувач";
  }

  function hasPermission(permission) {
    const session = getSession();

    if (!session) {
      return false;
    }

    const permissions =
      rolePermissions[session.role] || [];

    return (
      permissions.includes("*") ||
      permissions.includes(permission)
    );
  }

  function requireAuth(options) {
    const settings = options || {};
    const session = getSession();

    if (!session) {
      const currentPage =
        window.location.pathname.split("/").pop();

      if (currentPage !== "login.html") {
        sessionStorage.setItem(
          "radiologyosRedirectAfterLogin",
          currentPage || "index.html"
        );

        window.location.replace("login.html");
      }

      return false;
    }

    if (
      settings.permission &&
      !hasPermission(settings.permission)
    ) {
      alert(
        "У вас немає доступу до цього розділу."
      );

      window.location.replace(
        settings.deniedRedirect ||
        "executive-dashboard.html"
      );

      return false;
    }

    return true;
  }

  function redirectAfterLogin(defaultPage) {
    const savedPage =
      sessionStorage.getItem(
        "radiologyosRedirectAfterLogin"
      );

    sessionStorage.removeItem(
      "radiologyosRedirectAfterLogin"
    );

    window.location.href =
      savedPage ||
      defaultPage ||
      "executive-dashboard.html";
  }

  function updateCurrentUser(changes) {
    const session = getSession();

    if (!session) {
      return null;
    }

    const users = getUsers();

    const index = users.findIndex(
      user => user.id === session.userId
    );

    if (index === -1) {
      return null;
    }

    users[index] = {
      ...users[index],
      ...clone(changes),
      id: users[index].id
    };

    saveUsers(users);

    const updatedSession = {
      ...session,
      fullName: users[index].fullName,
      email: users[index].email,
      position: users[index].position,
      role: users[index].role
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(updatedSession)
    );

    return clone(users[index]);
  }

  function changePassword(
    currentPassword,
    newPassword
  ) {
    const session = getSession();

    if (!session) {
      return {
        success: false,
        message: "Користувач не авторизований."
      };
    }

    const users = getUsers();

    const index = users.findIndex(
      user => user.id === session.userId
    );

    if (index === -1) {
      return {
        success: false,
        message: "Користувача не знайдено."
      };
    }

    if (
      String(users[index].password) !==
      String(currentPassword)
    ) {
      return {
        success: false,
        message: "Поточний пароль неправильний."
      };
    }

    if (String(newPassword).length < 6) {
      return {
        success: false,
        message:
          "Новий пароль має містити щонайменше 6 символів."
      };
    }

    users[index].password = newPassword;

    saveUsers(users);

    return {
      success: true,
      message: "Пароль успішно змінено."
    };
  }

  function renderUserWidget(containerId) {
    const container =
      document.getElementById(containerId);

    if (!container) {
      return;
    }

    const user = getCurrentUser();

    if (!user) {
      container.innerHTML = `
        <a href="login.html">Увійти</a>
      `;

      return;
    }

    container.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        gap:10px;
      ">
        <div style="text-align:right">
          <strong style="
            display:block;
            font-size:13px;
          ">
            ${escapeHtml(user.fullName)}
          </strong>

          <span style="
            color:#667085;
            font-size:11px;
          ">
            ${escapeHtml(getRoleName(user.role))}
          </span>
        </div>

        <button
          type="button"
          onclick="RadiologyAuth.logout()"
          style="
            padding:8px 10px;
            border:none;
            border-radius:7px;
            background:#fdecec;
            color:#b42318;
            cursor:pointer;
            font-weight:700;
          "
        >
          Вийти
        </button>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.RadiologyAuth = {
    version: AUTH_VERSION,
    usersKey: USERS_KEY,
    sessionKey: SESSION_KEY,

    login,
    logout,
    getUsers,
    saveUsers,
    getSession,
    getCurrentUser,
    isAuthenticated,
    hasPermission,
    requireAuth,
    redirectAfterLogin,
    updateCurrentUser,
    changePassword,
    getRoleName,
    renderUserWidget
  };

  initializeUsers();

  console.log(
    "RadiologyOS Auth v" +
    AUTH_VERSION +
    " готовий"
  );
})();

(function () {
  "use strict";

  const STORAGE_KEY = "radiologyosTasks";
  const VERSION = 1;

  const defaultDatabase = {
    tasks: [
      {
        id: "TASK-1001",
        title: "Перевірити журнал КТ",
        description: "Перевірити правильність заповнення журналу за поточний день.",
        category: "Адміністративне",
        status: "Нове",
        priority: "Звичайний",

        createdBy: "Адаменко Д.М.",
        assignedTo: "Рентгенлаборант",
        collaborators: [],

        dueAt: "",
        completedAt: null,

        patientId: null,
        studyId: null,
        leadId: null,
        equipmentId: null,

        checklist: [],
        comments: [],
        attachments: [],

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],

    settings: {
      statuses: [
        "Нове",
        "Прийнято",
        "У роботі",
        "Очікує",
        "На перевірці",
        "Виконано",
        "Скасовано"
      ],

      priorities: [
        "Низький",
        "Звичайний",
        "Високий",
        "Критичний"
      ],

      categories: [
        "CRM",
        "Пацієнт",
        "Дослідження",
        "Протокол",
        "Обладнання",
        "Закупівля",
        "Звіт",
        "Адміністративне",
        "Інше"
      ]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    return (
      prefix +
      "-" +
      Date.now().toString().slice(-8) +
      Math.floor(Math.random() * 90 + 10)
    );
  }

  function initialize() {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(defaultDatabase)
        );

        return clone(defaultDatabase);
      }

      const database =
        JSON.parse(saved);

      if (
        !database ||
        !Array.isArray(database.tasks)
      ) {
        throw new Error(
          "Некоректна структура завдань"
        );
      }

      database.settings =
        database.settings ||
        clone(defaultDatabase.settings);

      return database;
    } catch (error) {
      console.error(
        "Помилка модуля завдань:",
        error
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultDatabase)
      );

      return clone(defaultDatabase);
    }
  }

  function readDatabase() {
    return clone(initialize());
  }

  function writeDatabase(database) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(database)
    );

    window.dispatchEvent(
      new CustomEvent(
        "radiologyos:tasks-changed",
        {
          detail: clone(database)
        }
      )
    );

    return clone(database);
  }

  function getAllTasks() {
    return readDatabase().tasks;
  }

  function getTaskById(id) {
    return (
      getAllTasks().find(
        task => task.id === id
      ) || null
    );
  }

  function createTask(data) {
    const database =
      readDatabase();

    const task = {
      id: createId("TASK"),

      title:
        String(data.title || "").trim(),

      description:
        String(data.description || "").trim(),

      category:
        data.category || "Інше",

      status:
        data.status || "Нове",

      priority:
        data.priority || "Звичайний",

      createdBy:
        String(data.createdBy || "").trim(),

      assignedTo:
        String(data.assignedTo || "").trim(),

      collaborators:
        Array.isArray(data.collaborators)
          ? clone(data.collaborators)
          : [],

      dueAt:
        data.dueAt || "",

      completedAt: null,

      patientId:
        data.patientId || null,

      studyId:
        data.studyId || null,

      leadId:
        data.leadId || null,

      equipmentId:
        data.equipmentId || null,

      checklist:
        Array.isArray(data.checklist)
          ? clone(data.checklist)
          : [],

      comments: [],
      attachments: [],

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };

    database.tasks.unshift(task);

    writeDatabase(database);

    return clone(task);
  }

  function updateTask(id, changes) {
    const database =
      readDatabase();

    const index =
      database.tasks.findIndex(
        task => task.id === id
      );

    if (index === -1) {
      return null;
    }

    database.tasks[index] = {
      ...database.tasks[index],
      ...clone(changes),
      id,
      updatedAt:
        new Date().toISOString()
    };

    writeDatabase(database);

    return clone(database.tasks[index]);
  }

  function removeTask(id) {
    const database =
      readDatabase();

    const exists =
      database.tasks.some(
        task => task.id === id
      );

    if (!exists) {
      return false;
    }

    database.tasks =
      database.tasks.filter(
        task => task.id !== id
      );

    writeDatabase(database);

    return true;
  }

  function changeStatus(id, status) {
    const changes = {
      status
    };

    if (status === "Виконано") {
      changes.completedAt =
        new Date().toISOString();
    } else {
      changes.completedAt = null;
    }

    return updateTask(id, changes);
  }

  function assignTask(id, assignedTo) {
    return updateTask(
      id,
      {
        assignedTo:
          String(assignedTo || "").trim()
      }
    );
  }

  function addComment(taskId, data) {
    const database =
      readDatabase();

    const task =
      database.tasks.find(
        item => item.id === taskId
      );

    if (!task) {
      return null;
    }

    const comment = {
      id: createId("COMMENT"),
      author:
        String(data.author || "").trim(),
      text:
        String(data.text || "").trim(),
      createdAt:
        new Date().toISOString()
    };

    task.comments =
      Array.isArray(task.comments)
        ? task.comments
        : [];

    task.comments.unshift(comment);

    task.updatedAt =
      new Date().toISOString();

    writeDatabase(database);

    return clone(comment);
  }

  function addChecklistItem(taskId, text) {
    const database =
      readDatabase();

    const task =
      database.tasks.find(
        item => item.id === taskId
      );

    if (!task) {
      return null;
    }

    const item = {
      id: createId("CHECK"),
      text:
        String(text || "").trim(),
      completed: false,
      completedAt: null
    };

    task.checklist =
      Array.isArray(task.checklist)
        ? task.checklist
        : [];

    task.checklist.push(item);

    task.updatedAt =
      new Date().toISOString();

    writeDatabase(database);

    return clone(item);
  }

  function toggleChecklistItem(
    taskId,
    itemId
  ) {
    const database =
      readDatabase();

    const task =
      database.tasks.find(
        item => item.id === taskId
      );

    if (!task) {
      return null;
    }

    const item =
      (task.checklist || []).find(
        entry => entry.id === itemId
      );

    if (!item) {
      return null;
    }

    item.completed =
      !item.completed;

    item.completedAt =
      item.completed
        ? new Date().toISOString()
        : null;

    task.updatedAt =
      new Date().toISOString();

    writeDatabase(database);

    return clone(item);
  }

  function getStatistics() {
    const tasks =
      getAllTasks();

    const now =
      new Date();

    return {
      total: tasks.length,

      new: tasks.filter(
        task => task.status === "Нове"
      ).length,

      inProgress: tasks.filter(
        task =>
          task.status === "Прийнято" ||
          task.status === "У роботі"
      ).length,

      review: tasks.filter(
        task =>
          task.status === "На перевірці"
      ).length,

      completed: tasks.filter(
        task =>
          task.status === "Виконано"
      ).length,

      overdue: tasks.filter(
        task =>
          task.status !== "Виконано" &&
          task.status !== "Скасовано" &&
          task.dueAt &&
          new Date(task.dueAt) < now
      ).length,

      critical: tasks.filter(
        task =>
          task.priority === "Критичний" &&
          task.status !== "Виконано" &&
          task.status !== "Скасовано"
      ).length
    };
  }

  function getTasksByEmployee(name) {
    return getAllTasks().filter(
      task =>
        task.assignedTo === name ||
        (task.collaborators || [])
          .includes(name)
    );
  }

  function getRelatedTasks(
    entityType,
    entityId
  ) {
    const fieldMap = {
      patient: "patientId",
      study: "studyId",
      lead: "leadId",
      equipment: "equipmentId"
    };

    const field =
      fieldMap[entityType];

    if (!field) {
      return [];
    }

    return getAllTasks().filter(
      task => task[field] === entityId
    );
  }

  function createTaskFromLead(
    leadId,
    data
  ) {
    return createTask({
      ...data,
      leadId,
      category: "CRM"
    });
  }

  function createTaskFromPatient(
    patientId,
    data
  ) {
    return createTask({
      ...data,
      patientId,
      category: "Пацієнт"
    });
  }

  function createTaskFromStudy(
    studyId,
    data
  ) {
    return createTask({
      ...data,
      studyId,
      category: "Дослідження"
    });
  }

  function createTaskFromEquipment(
    equipmentId,
    data
  ) {
    return createTask({
      ...data,
      equipmentId,
      category: "Обладнання"
    });
  }

  function exportDatabase() {
    const database =
      readDatabase();

    const blob =
      new Blob(
        [
          JSON.stringify(
            database,
            null,
            2
          )
        ],
        {
          type: "application/json"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "radiologyos-tasks-" +
      new Date()
        .toISOString()
        .slice(0, 10) +
      ".json";

    link.click();

    URL.revokeObjectURL(url);
  }

  function resetDatabase() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultDatabase)
    );

    window.dispatchEvent(
      new CustomEvent(
        "radiologyos:tasks-changed"
      )
    );

    return clone(defaultDatabase);
  }

  window.RadiologyTasks = {
    version: VERSION,
    storageKey: STORAGE_KEY,

    readDatabase,
    writeDatabase,

    getAllTasks,
    getTaskById,

    createTask,
    updateTask,
    removeTask,

    changeStatus,
    assignTask,

    addComment,
    addChecklistItem,
    toggleChecklistItem,

    getStatistics,
    getTasksByEmployee,
    getRelatedTasks,

    createTaskFromLead,
    createTaskFromPatient,
    createTaskFromStudy,
    createTaskFromEquipment,

    exportDatabase,
    resetDatabase
  };

  initialize();

  console.log(
    "RadiologyOS Tasks v" +
    VERSION +
    " готовий"
  );
})();

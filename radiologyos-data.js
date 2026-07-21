(function () {
  "use strict";

  const DATABASE_KEY = "radiologyosDatabase";
  const DATABASE_VERSION = 1;

  const defaultDatabase = {
    version: DATABASE_VERSION,

    department: {
      name: "Відділення променевої діагностики",
      institution: "Чернігівський військовий госпіталь",
      phone: "",
      email: "",
      updatedAt: null
    },

    patients: [
      {
        id: "PAT-1001",
        fullName: "Тестовий пацієнт",
        birthDate: "1985-04-12",
        phone: "",
        status: "Активний",
        createdAt: "2026-07-21T08:00:00"
      }
    ],

    studies: [
      {
        id: "STD-1001",
        patientId: "PAT-1001",
        modality: "КТ",
        region: "Головний мозок",
        contrast: false,
        status: "Заплановано",
        scheduledAt: "2026-07-21T12:30:00",
        doctor: "Адаменко Д.М.",
        technician: "Клімов Л.В.",
        createdAt: "2026-07-21T08:10:00"
      }
    ],

    protocols: [],

    appointments: [],

    tasks: [],

    notifications: [],

    inventory: [
      {
        id: "INV-1001",
        name: "Контрастна речовина",
        category: "Контраст",
        quantity: 8,
        unit: "флаконів",
        minimumQuantity: 5,
        updatedAt: "2026-07-21T08:00:00"
      }
    ],

    equipment: [
      {
        id: "EQ-1001",
        name: "Siemens CT",
        room: "Кабінет №1",
        status: "Працює",
        lastService: "2026-07-15",
        nextService: "2026-07-25"
      },
      {
        id: "EQ-1002",
        name: "AMAX 5000",
        room: "Рентгенівський кабінет",
        status: "Потребує контролю",
        lastService: "2026-07-18",
        nextService: "2026-07-22"
      }
    ],

    audit: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function now() {
    return new Date().toISOString();
  }

  function createId(prefix) {
    const timestamp = Date.now().toString(36).toUpperCase();

    const random = Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();

    return `${prefix}-${timestamp}-${random}`;
  }

  function readDatabase() {
    try {
      const saved = localStorage.getItem(DATABASE_KEY);

      if (!saved) {
        const initialDatabase = clone(defaultDatabase);

        localStorage.setItem(
          DATABASE_KEY,
          JSON.stringify(initialDatabase)
        );

        return initialDatabase;
      }

      const database = JSON.parse(saved);

      if (!database || typeof database !== "object") {
        throw new Error("Некоректний формат бази даних");
      }

      return database;
    } catch (error) {
      console.error("Помилка читання RadiologyOS:", error);

      return clone(defaultDatabase);
    }
  }

  function writeDatabase(database) {
    try {
      localStorage.setItem(
        DATABASE_KEY,
        JSON.stringify(database)
      );

      window.dispatchEvent(
        new CustomEvent("radiologyos:data-changed", {
          detail: {
            updatedAt: now()
          }
        })
      );

      return true;
    } catch (error) {
      console.error("Помилка збереження RadiologyOS:", error);

      return false;
    }
  }

  function addAuditEntry(action, module, recordId, details) {
    const database = readDatabase();

    if (!Array.isArray(database.audit)) {
      database.audit = [];
    }

    database.audit.unshift({
      id: createId("AUD"),
      action,
      module,
      recordId: recordId || null,
      details: details || "",
      createdAt: now()
    });

    database.audit = database.audit.slice(0, 500);

    writeDatabase(database);
  }

  function getAll(collectionName) {
    const database = readDatabase();
    const collection = database[collectionName];

    return Array.isArray(collection)
      ? clone(collection)
      : [];
  }

  function getById(collectionName, id) {
    const records = getAll(collectionName);

    return records.find(
      record => record.id === id
    ) || null;
  }

  function create(collectionName, data, prefix) {
    const database = readDatabase();

    if (!Array.isArray(database[collectionName])) {
      database[collectionName] = [];
    }

    const record = {
      id: data.id || createId(prefix || "REC"),
      ...clone(data),
      createdAt: data.createdAt || now(),
      updatedAt: now()
    };

    database[collectionName].unshift(record);

    const saved = writeDatabase(database);

    if (saved) {
      addAuditEntry(
        "Створено запис",
        collectionName,
        record.id,
        ""
      );
    }

    return saved ? clone(record) : null;
  }

  function update(collectionName, id, changes) {
    const database = readDatabase();
    const collection = database[collectionName];

    if (!Array.isArray(collection)) {
      return null;
    }

    const index = collection.findIndex(
      record => record.id === id
    );

    if (index === -1) {
      return null;
    }

    collection[index] = {
      ...collection[index],
      ...clone(changes),
      id,
      updatedAt: now()
    };

    const saved = writeDatabase(database);

    if (saved) {
      addAuditEntry(
        "Оновлено запис",
        collectionName,
        id,
        ""
      );
    }

    return saved
      ? clone(collection[index])
      : null;
  }

  function remove(collectionName, id) {
    const database = readDatabase();
    const collection = database[collectionName];

    if (!Array.isArray(collection)) {
      return false;
    }

    const initialLength = collection.length;

    database[collectionName] = collection.filter(
      record => record.id !== id
    );

    if (
      database[collectionName].length === initialLength
    ) {
      return false;
    }

    const saved = writeDatabase(database);

    if (saved) {
      addAuditEntry(
        "Видалено запис",
        collectionName,
        id,
        ""
      );
    }

    return saved;
  }

  function search(collectionName, query, fields) {
    const normalizedQuery =
      String(query || "").trim().toLowerCase();

    if (!normalizedQuery) {
      return getAll(collectionName);
    }

    return getAll(collectionName).filter((record) => {
      const searchFields =
        Array.isArray(fields) && fields.length
          ? fields
          : Object.keys(record);

      return searchFields.some((field) => {
        const value = record[field];

        return String(value || "")
          .toLowerCase()
          .includes(normalizedQuery);
      });
    });
  }

  function count(collectionName, filters) {
    let records = getAll(collectionName);

    if (filters && typeof filters === "object") {
      records = records.filter((record) =>
        Object.entries(filters).every(
          ([key, value]) => record[key] === value
        )
      );
    }

    return records.length;
  }

  function exportDatabase() {
    const database = readDatabase();

    const file = new Blob(
      [JSON.stringify(database, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      "radiologyos-backup-" +
      new Date().toISOString().slice(0, 10) +
      ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function importDatabase(database) {
    if (
      !database ||
      typeof database !== "object" ||
      !database.version
    ) {
      throw new Error(
        "Файл не є резервною копією RadiologyOS"
      );
    }

    const saved = writeDatabase(database);

    if (!saved) {
      throw new Error(
        "Не вдалося зберегти імпортовані дані"
      );
    }

    return true;
  }

  function resetDatabase() {
    const database = clone(defaultDatabase);

    writeDatabase(database);

    return clone(database);
  }

  function getStatistics() {
    const database = readDatabase();

    const studies = Array.isArray(database.studies)
      ? database.studies
      : [];

    const today =
      new Date().toISOString().slice(0, 10);

    return {
      patients: Array.isArray(database.patients)
        ? database.patients.length
        : 0,

      studies: studies.length,

      studiesToday: studies.filter((study) =>
        String(
          study.scheduledAt ||
          study.createdAt ||
          ""
        ).startsWith(today)
      ).length,

      completedStudies: studies.filter(
        study => study.status === "Завершено"
      ).length,

      protocols: Array.isArray(database.protocols)
        ? database.protocols.length
        : 0,

      tasks: Array.isArray(database.tasks)
        ? database.tasks.length
        : 0,

      notifications: Array.isArray(database.notifications)
        ? database.notifications.length
        : 0
    };
  }

  window.RadiologyOS = {
    databaseKey: DATABASE_KEY,
    version: DATABASE_VERSION,

    readDatabase,
    writeDatabase,
    getAll,
    getById,
    create,
    update,
    remove,
    search,
    count,
    getStatistics,
    exportDatabase,
    importDatabase,
    resetDatabase,
    createId
  };

  readDatabase();

  console.log(
    "RadiologyOS Data Layer v" +
    DATABASE_VERSION +
    " готовий"
  );
})();

(function () {
  "use strict";

  const STORAGE_KEY = "radiologyosCRM";
  const VERSION = 1;

  const defaultDatabase = {
    leads: [
      {
        id: "LEAD-1001",
        fullName: "Тестовий пацієнт",
        phone: "",
        source: "Сайт",
        service: "КТ головного мозку",
        status: "Нове звернення",
        priority: "Звичайний",
        assignedTo: "Адаменко Д.М.",
        patientId: "PAT-1001",
        studyId: "STD-1001",
        notes: "Тестове звернення CRM",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],

    communications: [],

    followUps: [],

    settings: {
      sources: [
        "Сайт",
        "Meta Ads",
        "Google",
        "Телефон",
        "Направлення лікаря",
        "Повторний пацієнт",
        "Рекомендація",
        "Інше"
      ],

      statuses: [
        "Нове звернення",
        "Потрібен дзвінок",
        "Записаний",
        "Підтверджений",
        "Обстежений",
        "Протокол готовий",
        "Закрито",
        "Скасовано"
      ],

      priorities: [
        "Низький",
        "Звичайний",
        "Високий",
        "Терміновий"
      ]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    const number =
      Date.now().toString().slice(-8);

    const random =
      Math.floor(Math.random() * 90 + 10);

    return prefix + "-" + number + random;
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
        !Array.isArray(database.leads) ||
        !Array.isArray(database.communications) ||
        !Array.isArray(database.followUps)
      ) {
        throw new Error(
          "Некоректна структура CRM"
        );
      }

      return database;
    } catch (error) {
      console.error(
        "Помилка CRM:",
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
        "radiologyos:crm-changed",
        {
          detail: clone(database)
        }
      )
    );

    return clone(database);
  }

  function getAll(collection) {
    const database =
      readDatabase();

    const items =
      database[collection];

    return Array.isArray(items)
      ? clone(items)
      : [];
  }

  function getById(collection, id) {
    return (
      getAll(collection).find(
        item => item.id === id
      ) || null
    );
  }

  function createLead(data) {
    const database =
      readDatabase();

    const lead = {
      id: createId("LEAD"),
      fullName:
        String(data.fullName || "").trim(),
      phone:
        String(data.phone || "").trim(),
      source:
        data.source || "Інше",
      service:
        String(data.service || "").trim(),
      status:
        data.status || "Нове звернення",
      priority:
        data.priority || "Звичайний",
      assignedTo:
        String(data.assignedTo || "").trim(),
      patientId:
        data.patientId || null,
      studyId:
        data.studyId || null,
      notes:
        String(data.notes || "").trim(),
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString()
    };

    database.leads.unshift(lead);

    writeDatabase(database);

    return clone(lead);
  }

  function updateLead(id, changes) {
    const database =
      readDatabase();

    const index =
      database.leads.findIndex(
        lead => lead.id === id
      );

    if (index === -1) {
      return null;
    }

    database.leads[index] = {
      ...database.leads[index],
      ...clone(changes),
      id,
      updatedAt:
        new Date().toISOString()
    };

    writeDatabase(database);

    return clone(database.leads[index]);
  }

  function removeLead(id) {
    const database =
      readDatabase();

    const exists =
      database.leads.some(
        lead => lead.id === id
      );

    if (!exists) {
      return false;
    }

    database.leads =
      database.leads.filter(
        lead => lead.id !== id
      );

    database.communications =
      database.communications.filter(
        item => item.leadId !== id
      );

    database.followUps =
      database.followUps.filter(
        item => item.leadId !== id
      );

    writeDatabase(database);

    return true;
  }

  function addCommunication(data) {
    const database =
      readDatabase();

    const communication = {
      id: createId("COM"),
      leadId: data.leadId,
      type: data.type || "Дзвінок",
      direction:
        data.direction || "Вихідний",
      result:
        String(data.result || "").trim(),
      author:
        String(data.author || "").trim(),
      createdAt:
        new Date().toISOString()
    };

    database.communications.unshift(
      communication
    );

    writeDatabase(database);

    return clone(communication);
  }

  function getLeadCommunications(leadId) {
    return getAll(
      "communications"
    )
      .filter(
        item => item.leadId === leadId
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
  }

  function createFollowUp(data) {
    const database =
      readDatabase();

    const followUp = {
      id: createId("FOLLOW"),
      leadId: data.leadId,
      title:
        String(data.title || "").trim(),
      dueAt: data.dueAt,
      assignedTo:
        String(data.assignedTo || "").trim(),
      status: "Заплановано",
      notes:
        String(data.notes || "").trim(),
      createdAt:
        new Date().toISOString(),
      completedAt: null
    };

    database.followUps.unshift(
      followUp
    );

    writeDatabase(database);

    return clone(followUp);
  }

  function updateFollowUp(id, changes) {
    const database =
      readDatabase();

    const index =
      database.followUps.findIndex(
        item => item.id === id
      );

    if (index === -1) {
      return null;
    }

    database.followUps[index] = {
      ...database.followUps[index],
      ...clone(changes),
      id
    };

    writeDatabase(database);

    return clone(
      database.followUps[index]
    );
  }

  function completeFollowUp(id) {
    return updateFollowUp(
      id,
      {
        status: "Виконано",
        completedAt:
          new Date().toISOString()
      }
    );
  }

  function removeFollowUp(id) {
    const database =
      readDatabase();

    database.followUps =
      database.followUps.filter(
        item => item.id !== id
      );

    writeDatabase(database);

    return true;
  }

  function getStatistics() {
    const database =
      readDatabase();

    const active =
      database.leads.filter(
        lead =>
          lead.status !== "Закрито" &&
          lead.status !== "Скасовано"
      );

    const booked =
      database.leads.filter(
        lead =>
          lead.status === "Записаний" ||
          lead.status === "Підтверджений"
      );

    const completed =
      database.leads.filter(
        lead =>
          lead.status === "Обстежений" ||
          lead.status === "Протокол готовий" ||
          lead.status === "Закрито"
      );

    const overdue =
      database.followUps.filter(
        item =>
          item.status !== "Виконано" &&
          item.dueAt &&
          new Date(item.dueAt) <
            new Date()
      );

    return {
      total: database.leads.length,
      active: active.length,
      booked: booked.length,
      completed: completed.length,
      overdue: overdue.length,
      communications:
        database.communications.length
    };
  }

  function getConversionBySource() {
    const database =
      readDatabase();

    const result = {};

    database.leads.forEach((lead) => {
      const source =
        lead.source || "Інше";

      if (!result[source]) {
        result[source] = {
          source,
          total: 0,
          converted: 0
        };
      }

      result[source].total += 1;

      if (
        lead.status === "Обстежений" ||
        lead.status === "Протокол готовий" ||
        lead.status === "Закрито"
      ) {
        result[source].converted += 1;
      }
    });

    return Object.values(result).map(
      item => ({
        ...item,
        conversion:
          item.total
            ? Math.round(
                item.converted /
                item.total *
                100
              )
            : 0
      })
    );
  }

  function linkPatient(
    leadId,
    patientId
  ) {
    return updateLead(
      leadId,
      { patientId }
    );
  }

  function linkStudy(
    leadId,
    studyId
  ) {
    return updateLead(
      leadId,
      { studyId }
    );
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
      "radiologyos-crm-" +
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
        "radiologyos:crm-changed"
      )
    );

    return clone(defaultDatabase);
  }

  window.RadiologyCRM = {
    version: VERSION,
    storageKey: STORAGE_KEY,

    readDatabase,
    writeDatabase,

    getAll,
    getById,

    createLead,
    updateLead,
    removeLead,

    addCommunication,
    getLeadCommunications,

    createFollowUp,
    updateFollowUp,
    completeFollowUp,
    removeFollowUp,

    getStatistics,
    getConversionBySource,

    linkPatient,
    linkStudy,

    exportDatabase,
    resetDatabase
  };

  initialize();

  console.log(
    "RadiologyOS CRM v" +
    VERSION +
    " готова"
  );
})();

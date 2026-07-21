(function () {
  "use strict";

  const STORAGE_KEY = "radiologyosProtocolTemplates";
  const VERSION = 1;

  const defaultTemplates = [
    {
      id: "TPL-BRAIN-NORMAL",
      name: "КТ головного мозку — без патології",
      modality: "КТ",
      region: "Головний мозок",
      category: "Норма",

      description:
        "На серії КТ-зображень головного мозку в нативному режимі " +
        "вогнищевих та об’ємних змін не виявлено. " +
        "Диференціація сірої та білої речовини збережена. " +
        "Серединні структури не зміщені. " +
        "Шлуночкова система не розширена, симетрична. " +
        "Базальні цистерни вільні. " +
        "Субарахноїдальні простори не розширені. " +
        "Кістки склепіння та основи черепа без ознак гострого ушкодження.",

      conclusion:
        "КТ-ознак гострої внутрішньочерепної патології не виявлено.",

      fields: []
    },

    {
      id: "TPL-BRAIN-ISCHEMIA",
      name: "КТ головного мозку — ішемічні зміни",
      modality: "КТ",
      region: "Головний мозок",
      category: "Судинні зміни",

      description:
        "У {location} визначається ділянка зниженої щільності " +
        "розмірами до {size}, з нечіткими контурами та частковою " +
        "втратою диференціації сірої і білої речовини. " +
        "Ознаки геморагічного компонента не визначаються. " +
        "Серединні структури {midline}. " +
        "Шлуночкова система {ventricles}.",

      conclusion:
        "КТ-ознаки ішемічних змін у {location}.",

      fields: [
        {
          key: "location",
          label: "Локалізація",
          type: "select",
          options: [
            "правій півкулі головного мозку",
            "лівій півкулі головного мозку",
            "правій лобній частці",
            "лівій лобній частці",
            "правій тім’яній частці",
            "лівій тім’яній частці",
            "правій скроневій частці",
            "лівій скроневій частці",
            "правій потиличній частці",
            "лівій потиличній частці",
            "басейні правої СМА",
            "басейні лівої СМА"
          ]
        },

        {
          key: "size",
          label: "Розміри",
          type: "text",
          placeholder: "наприклад 2,4 × 1,8 см"
        },

        {
          key: "midline",
          label: "Серединні структури",
          type: "select",
          options: [
            "не зміщені",
            "зміщені праворуч до 3 мм",
            "зміщені ліворуч до 3 мм",
            "зміщені праворуч до 5 мм",
            "зміщені ліворуч до 5 мм"
          ]
        },

        {
          key: "ventricles",
          label: "Шлуночкова система",
          type: "select",
          options: [
            "не розширена",
            "помірно розширена",
            "асиметрична",
            "компримована"
          ]
        }
      ]
    },

    {
      id: "TPL-BRAIN-HEMORRHAGE",
      name: "КТ головного мозку — внутрішньомозковий крововилив",
      modality: "КТ",
      region: "Головний мозок",
      category: "Крововилив",

      description:
        "У {location} визначається гіперденсивне вогнище " +
        "щільністю близько {density} HU, розмірами {size}, " +
        "що відповідає внутрішньомозковому крововиливу. " +
        "Навколо визначається зона перифокального набряку. " +
        "Серединні структури {midline}. " +
        "Шлуночкова система {ventricles}.",

      conclusion:
        "КТ-ознаки внутрішньомозкового крововиливу у {location}, " +
        "розмірами {size}.",

      fields: [
        {
          key: "location",
          label: "Локалізація",
          type: "text",
          placeholder: "наприклад права тім’яна частка"
        },

        {
          key: "density",
          label: "Щільність, HU",
          type: "number",
          placeholder: "65"
        },

        {
          key: "size",
          label: "Розміри",
          type: "text",
          placeholder: "3,2 × 2,1 × 2,5 см"
        },

        {
          key: "midline",
          label: "Серединні структури",
          type: "select",
          options: [
            "не зміщені",
            "зміщені праворуч до 3 мм",
            "зміщені ліворуч до 3 мм",
            "зміщені праворуч до 5 мм",
            "зміщені ліворуч до 5 мм"
          ]
        },

        {
          key: "ventricles",
          label: "Шлуночкова система",
          type: "select",
          options: [
            "не розширена",
            "компримована",
            "деформована",
            "містить геморагічний компонент"
          ]
        }
      ]
    },

    {
      id: "TPL-CHEST-NORMAL",
      name: "КТ органів грудної клітки — без патології",
      modality: "КТ",
      region: "Органи грудної клітки",
      category: "Норма",

      description:
        "Легені розправлені. Вогнищевих та інфільтративних змін " +
        "не виявлено. Трахея та головні бронхи прохідні. " +
        "Плевральні порожнини вільні. " +
        "Середостіння не зміщене. " +
        "Внутрішньогрудні лімфатичні вузли не збільшені. " +
        "Рідина у порожнині перикарда не визначається.",

      conclusion:
        "КТ-ознак патологічних змін органів грудної клітки не виявлено.",

      fields: []
    },

    {
      id: "TPL-CHEST-PNEUMONIA",
      name: "КТ органів грудної клітки — пневмонія",
      modality: "КТ",
      region: "Органи грудної клітки",
      category: "Запальні зміни",

      description:
        "У {segments} визначаються ділянки {changeType}, " +
        "на тлі яких простежуються повітряні просвіти бронхів. " +
        "Плевральний випіт {pleuralFluid}. " +
        "Внутрішньогрудні лімфатичні вузли {nodes}.",

      conclusion:
        "КТ-ознаки {diagnosis} з ураженням {segments}.",

      fields: [
        {
          key: "segments",
          label: "Сегменти",
          type: "text",
          placeholder: "наприклад S6, S9, S10 правої легені"
        },

        {
          key: "changeType",
          label: "Тип змін",
          type: "select",
          options: [
            "інфільтративної консолідації",
            "ущільнення типу «матового скла»",
            "інфільтративно-ателектатичних змін",
            "полісегментарної інфільтрації"
          ]
        },

        {
          key: "pleuralFluid",
          label: "Плевральний випіт",
          type: "select",
          options: [
            "не визначається",
            "визначається праворуч",
            "визначається ліворуч",
            "визначається з обох боків"
          ]
        },

        {
          key: "nodes",
          label: "Лімфатичні вузли",
          type: "select",
          options: [
            "не збільшені",
            "помірно збільшені",
            "збільшені"
          ]
        },

        {
          key: "diagnosis",
          label: "Формулювання",
          type: "select",
          options: [
            "правобічної полісегментарної пневмонії",
            "лівобічної полісегментарної пневмонії",
            "двобічної полісегментарної пневмонії",
            "вогнищевої пневмонії"
          ]
        }
      ]
    },

    {
      id: "TPL-ABDOMEN-NORMAL",
      name: "КТ черевної порожнини — без патології",
      modality: "КТ",
      region: "Черевна порожнина та малий таз",
      category: "Норма",

      description:
        "Печінка не збільшена, структура однорідна. " +
        "Внутрішньо- та позапечінкові жовчні протоки не розширені. " +
        "Жовчний міхур без рентгенконтрастних конкрементів. " +
        "Підшлункова залоза не збільшена, структура однорідна. " +
        "Селезінка не збільшена. " +
        "Нирки розташовані типово, чашково-мискові системи не розширені. " +
        "Вільна рідина у черевній порожнині та малому тазі не визначається.",

      conclusion:
        "КТ-ознак гострої патології органів черевної порожнини " +
        "та малого таза не виявлено.",

      fields: []
    },

    {
      id: "TPL-SPINE-DEGENERATIVE",
      name: "КТ хребта — дегенеративні зміни",
      modality: "КТ",
      region: "Поперековий відділ хребта",
      category: "Дегенеративні зміни",

      description:
        "Висота тіл хребців збережена. " +
        "Визначаються крайові кісткові розростання тіл хребців, " +
        "субхондральний склероз замикальних пластинок. " +
        "Висота міжхребцевого диска {disc} знижена. " +
        "На рівні {level} визначається {lesion} до {size}, " +
        "що деформує передній контур дурального мішка. " +
        "Хребтовий канал на цьому рівні до {canal} мм.",

      conclusion:
        "КТ-ознаки остеохондрозу та деформуючого спондильозу. " +
        "{lesionConclusion} на рівні {level}.",

      fields: [
        {
          key: "disc",
          label: "Стан диска",
          type: "select",
          options: [
            "L3–L4",
            "L4–L5",
            "L5–S1",
            "L4–L5 та L5–S1"
          ]
        },

        {
          key: "level",
          label: "Рівень патології",
          type: "select",
          options: [
            "L3–L4",
            "L4–L5",
            "L5–S1"
          ]
        },

        {
          key: "lesion",
          label: "Тип зміни",
          type: "select",
          options: [
            "циркулярна протрузія диска",
            "дорзальна протрузія диска",
            "медіанна кила диска",
            "парамедіанна кила диска"
          ]
        },

        {
          key: "size",
          label: "Розмір",
          type: "text",
          placeholder: "наприклад 5,5 мм"
        },

        {
          key: "canal",
          label: "Канал, мм",
          type: "number",
          placeholder: "9"
        },

        {
          key: "lesionConclusion",
          label: "Формулювання висновку",
          type: "select",
          options: [
            "Протрузія міжхребцевого диска",
            "Кила міжхребцевого диска"
          ]
        }
      ]
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initializeTemplates() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(defaultTemplates)
        );

        return clone(defaultTemplates);
      }

      const templates = JSON.parse(saved);

      if (!Array.isArray(templates)) {
        throw new Error("Некоректна бібліотека шаблонів");
      }

      return templates;
    } catch (error) {
      console.error("Помилка шаблонів:", error);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultTemplates)
      );

      return clone(defaultTemplates);
    }
  }

  function getAll() {
    return clone(initializeTemplates());
  }

  function getById(id) {
    return getAll().find(
      template => template.id === id
    ) || null;
  }

  function getByRegion(region) {
    return getAll().filter(
      template => template.region === region
    );
  }

  function search(query) {
    const value =
      String(query || "").trim().toLowerCase();

    if (!value) {
      return getAll();
    }

    return getAll().filter((template) =>
      String(template.name || "")
        .toLowerCase()
        .includes(value) ||
      String(template.region || "")
        .toLowerCase()
        .includes(value) ||
      String(template.category || "")
        .toLowerCase()
        .includes(value)
    );
  }

  function replaceFields(text, values) {
    let result = String(text || "");

    Object.entries(values || {}).forEach(
      ([key, value]) => {
        const pattern =
          new RegExp("\\{" + key + "\\}", "g");

        result = result.replace(
          pattern,
          String(value || "—")
        );
      }
    );

    return result;
  }

  function generate(templateId, values) {
    const template = getById(templateId);

    if (!template) {
      return null;
    }

    return {
      templateId: template.id,
      templateName: template.name,

      description:
        replaceFields(
          template.description,
          values
        ),

      conclusion:
        replaceFields(
          template.conclusion,
          values
        )
    };
  }

  function saveTemplate(template) {
    const templates = getAll();

    const index = templates.findIndex(
      item => item.id === template.id
    );

    if (index === -1) {
      templates.unshift(clone(template));
    } else {
      templates[index] = clone(template);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(templates)
    );

    return clone(template);
  }

  function removeTemplate(id) {
    const templates =
      getAll().filter(
        template => template.id !== id
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(templates)
    );

    return true;
  }

  function resetTemplates() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultTemplates)
    );

    return clone(defaultTemplates);
  }

  window.RadiologyTemplates = {
    version: VERSION,
    storageKey: STORAGE_KEY,

    getAll,
    getById,
    getByRegion,
    search,
    generate,
    saveTemplate,
    removeTemplate,
    resetTemplates
  };

  initializeTemplates();

  console.log(
    "RadiologyOS Templates v" +
    VERSION +
    " готові"
  );
})();

interface Plant {
  id: number;
  name: string;
  waterInterval: number;
  lastWatered: string | null;
  notes: string;
}

const STORAGE_KEY = "plant-care-plants";

function isPlant(value: unknown): value is Plant {
  if (typeof value !== "object" || value === null) return false;

  const plant = value as Record<string, unknown>;
  return (
    typeof plant.id === "number" &&
    Number.isSafeInteger(plant.id) &&
    typeof plant.name === "string" &&
    typeof plant.waterInterval === "number" &&
    Number.isInteger(plant.waterInterval) &&
    plant.waterInterval > 0 &&
    (typeof plant.lastWatered === "string" || plant.lastWatered === null) &&
    typeof plant.notes === "string"
  );
}

function getPlants(): Plant[] {
  const savedPlants = localStorage.getItem(STORAGE_KEY);

  if (!savedPlants) return [];

  try {
    const plants: unknown = JSON.parse(savedPlants);
    return Array.isArray(plants) ? plants.filter(isPlant) : [];
  } catch {
    return [];
  }
}

function savePlants(plants: Plant[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

function addPlant(plant: Plant): void {
  savePlants([...getPlants(), plant]);
}

function deletePlant(id: number): void {
  savePlants(getPlants().filter((plant) => plant.id !== id));
}

function updatePlant(updatedPlant: Plant): void {
  savePlants(
    getPlants().map((plant) =>
      plant.id === updatedPlant.id ? updatedPlant : plant,
    ),
  );
}

function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsedDate = new Date(0);

  parsedDate.setHours(0, 0, 0, 0);
  parsedDate.setFullYear(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextWateringDate(
  lastWatered: string | null | undefined,
  interval: number,
): Date {
  const baseDate = parseLocalDate(lastWatered);
  if (!baseDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + interval);
    return today;
  }

  baseDate.setHours(0, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() + interval);
  return baseDate;
}

function getPlantStatus(
  nextDate: Date | null | undefined,
): "Aman" | "Segera disiram" | "Perlu disiram" {
  if (!nextDate || Number.isNaN(nextDate.getTime())) {
    return "Perlu disiram";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNumber = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const nextDateNumber = Date.UTC(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
  );
  const daysUntilWatering = (nextDateNumber - todayNumber) / 86_400_000;

  if (daysUntilWatering <= 0) return "Perlu disiram";
  if (daysUntilWatering <= 2) return "Segera disiram";
  return "Aman";
}

function formatDate(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "Belum tersedia";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Elemen #app tidak ditemukan");
}

const root = app;

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function render(): void {
  const plants = getPlants();

  root.innerHTML = `
        <header class="header">
            <h1>🌱 Plant Care Scheduler</h1>
            <p>Kelola tanaman dan jadwal penyiramanmu.</p>
        </header>

        <section class="form-section">
            <h2>Tambah Tanaman</h2>

            <form id="plantForm">

                <label>Nama Tanaman</label>
                <input
                    type="text"
                    id="name"
                    placeholder="Contoh: Monstera"
                    required
                >

                <label>Interval Penyiraman (hari)</label>
                <input
                    type="number"
                    id="interval"
                    min="1"
                    value="3"
                    required
                >

                <label>Tanggal Terakhir Disiram</label>
                <input
                    type="date"
                    id="lastWatered"
                >

                <label>Catatan</label>
                <textarea
                    id="notes"
                    placeholder="Catatan tanaman..."
                ></textarea>

                <button type="submit">
                    + Tambah Tanaman
                </button>

            </form>
        </section>

        <section class="plant-section">
            <h2>Daftar Tanaman (${plants.length})</h2>

            <div class="plant-list">

                ${
                  plants.length === 0
                    ? `<p class="empty">Belum ada tanaman. Silakan tambahkan tanaman.</p>`
                    : plants
                        .map((plant) => {
                          const nextDate = getNextWateringDate(
                            plant.lastWatered,
                            plant.waterInterval,
                          );

                          const status = getPlantStatus(nextDate);

                          return `
                            <article class="plant-card">

                                <div class="plant-info">
                                    <h3>🪴 ${escapeHTML(plant.name)}</h3>

                                    <p>
                                        Interval:
                                        ${plant.waterInterval} hari
                                    </p>

                                    <p>
                                        Terakhir disiram:
                                        ${
                                          plant.lastWatered
                                            ? escapeHTML(
                                                formatDate(
                                                  parseLocalDate(plant.lastWatered),
                                                ),
                                              )
                                            : "Belum pernah"
                                        }
                                    </p>

                                    <p>
                                        Penyiraman berikutnya:
                                        ${formatDate(nextDate)}
                                    </p>

                                    <p>
                                        Catatan:
                                        ${escapeHTML(plant.notes || "-")}
                                    </p>

                                    <span class="status ${status === "Aman" ? "safe" : status === "Segera disiram" ? "soon" : "due"}">
                                      ${escapeHTML(status)}
                                    </span>
                                </div>

                                <div class="actions">
                                    <button
                                        class="water-btn"
                                        data-water="${plant.id}"
                                    >
                                        Sudah Disiram
                                    </button>

                                    <button
                                        class="delete-btn"
                                        data-delete="${plant.id}"
                                    >
                                        Hapus
                                    </button>
                                </div>

                            </article>
                        `;
                        })
                        .join("")
                }

            </div>
        </section>
    `;

  bindEvents();
}

function bindEvents(): void {
  const form = document.querySelector<HTMLFormElement>("#plantForm");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = (
      document.querySelector<HTMLInputElement>("#name")?.value ?? ""
    ).trim();

    const interval = Number(
      document.querySelector<HTMLInputElement>("#interval")?.value,
    );

    const lastWatered =
      document.querySelector<HTMLInputElement>("#lastWatered")?.value || null;

    const notes =
      document.querySelector<HTMLTextAreaElement>("#notes")?.value ?? "";

    if (!name || !Number.isInteger(interval) || interval <= 0) {
      alert("Isi nama dan interval penyiraman dengan benar.");
      return;
    }

    const plant: Plant = {
      id: Date.now(),
      name,
      waterInterval: interval,
      lastWatered,
      notes,
    };

    addPlant(plant);

    render();
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-delete]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.delete);

        if (confirm("Yakin ingin menghapus tanaman ini?")) {
          deletePlant(id);
          render();
        }
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-water]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.water);

        const plant = getPlants().find((item) => item.id === id);

        if (!plant) return;

        updatePlant({
          ...plant,
          lastWatered: toLocalDateString(new Date()),
        });

        render();
      });
    });
}

render();
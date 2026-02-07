const STORAGE_KEY = 'questflow-state-v1';
const XP_PER_TASK = 20;
const XP_PER_ROUTINE = 10;
const TASK_DAMAGE = 12;
const ROUTINE_DAMAGE = 6;
const LEVEL_XP = 100;
const WORK_SECONDS = 20 * 60;
const BREAK_SECONDS = 5 * 60;
const HABITICA_API_BASE = 'https://habitica.com/api/v3';

const monsterNames = [
  'Ember Lynx',
  'Gloom Warden',
  'Quartz Drake',
  'Brass Howler',
  'Moss Colossus',
  'Aether Moth',
  'Iron Basilisk',
  'Stormbound Elk'
];

const PLACEHOLDER_MONSTER_IMAGE = 'assets/monsters/placeholder-monster.svg';
const DEFAULT_MONSTER_IMAGES = {
  'Ember Lynx': 'assets/monsters/ember-lynx.svg',
  'Gloom Warden': 'assets/monsters/gloom-warden.svg',
  'Quartz Drake': 'assets/monsters/quartz-drake.svg',
  'Brass Howler': 'assets/monsters/brass-howler.svg',
  'Moss Colossus': 'assets/monsters/moss-colossus.svg',
  'Aether Moth': 'assets/monsters/aether-moth.svg',
  'Iron Basilisk': 'assets/monsters/iron-basilisk.svg',
  'Stormbound Elk': 'assets/monsters/stormbound-elk.svg'
};

const ALLOWED_MONSTER_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_MONSTER_IMAGE_BYTES = 900 * 1024;

const state = loadState();

const elements = {
  xpValue: document.getElementById('xpValue'),
  levelValue: document.getElementById('levelValue'),
  streakValue: document.getElementById('streakValue'),
  monsterValue: document.getElementById('monsterValue'),
  tasksList: document.getElementById('tasksList'),
  routineList: document.getElementById('routineList'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  addRoutineBtn: document.getElementById('addRoutineBtn'),
  importHabiticaBtn: document.getElementById('importHabiticaBtn'),
  importTimeblockBtn: document.getElementById('importTimeblockBtn'),
  searchInput: document.getElementById('searchInput'),
  filterType: document.getElementById('filterType'),
  filterStatus: document.getElementById('filterStatus'),
  filterTags: document.getElementById('filterTags'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  tagsList: document.getElementById('tagsList'),
  addTagBtn: document.getElementById('addTagBtn'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalInput: document.getElementById('modalInput'),
  routineToggles: document.getElementById('routineToggles'),
  routineXpToggle: document.getElementById('routineXpToggle'),
  routineStreakToggle: document.getElementById('routineStreakToggle'),
  tagOptions: document.getElementById('tagOptions'),
  tagEmptyState: document.getElementById('tagEmptyState'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  saveModalBtn: document.getElementById('saveModalBtn'),
  importModal: document.getElementById('importModal'),
  importTitle: document.getElementById('importTitle'),
  habiticaFields: document.getElementById('habiticaFields'),
  habiticaUserId: document.getElementById('habiticaUserId'),
  habiticaApiToken: document.getElementById('habiticaApiToken'),
  habiticaClient: document.getElementById('habiticaClient'),
  habiticaTodosToggle: document.getElementById('habiticaTodosToggle'),
  habiticaDailiesToggle: document.getElementById('habiticaDailiesToggle'),
  timeblockFields: document.getElementById('timeblockFields'),
  timeblockInput: document.getElementById('timeblockInput'),
  timeblockFile: document.getElementById('timeblockFile'),
  timeblockXpToggle: document.getElementById('timeblockXpToggle'),
  timeblockStreakToggle: document.getElementById('timeblockStreakToggle'),
  importStatus: document.getElementById('importStatus'),
  cancelImportBtn: document.getElementById('cancelImportBtn'),
  confirmImportBtn: document.getElementById('confirmImportBtn'),
  tagModal: document.getElementById('tagModal'),
  tagModalTitle: document.getElementById('tagModalTitle'),
  tagNameInput: document.getElementById('tagNameInput'),
  cancelTagBtn: document.getElementById('cancelTagBtn'),
  saveTagBtn: document.getElementById('saveTagBtn'),
  timerLabel: document.getElementById('timerLabel'),
  timerDisplay: document.getElementById('timerDisplay'),
  timerNote: document.getElementById('timerNote'),
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  skipBtn: document.getElementById('skipBtn'),
  monsterName: document.getElementById('monsterName'),
  monsterLevel: document.getElementById('monsterLevel'),
  monsterHpFill: document.getElementById('monsterHpFill'),
  monsterHpText: document.getElementById('monsterHpText'),
  monsterState: document.getElementById('monsterState'),
  monsterLog: document.getElementById('monsterLog'),
  monsterImage: document.getElementById('monsterImage'),
  monsterBattleImage: document.getElementById('monsterBattleImage'),
  monsterImageInput: document.getElementById('monsterImageInput'),
  monsterImageBtn: document.getElementById('monsterImageBtn'),
  monsterImageResetBtn: document.getElementById('monsterImageResetBtn'),
  toast: document.getElementById('toast')
};

const modalState = {
  type: 'task',
  mode: 'add',
  id: null,
  tagIds: []
};

const importState = {
  type: 'habitica'
};

const tagModalState = {
  mode: 'add',
  id: null
};

const filterState = {
  query: '',
  type: 'all',
  status: 'all',
  tagIds: new Set()
};

const pomodoro = {
  mode: 'work',
  remaining: WORK_SECONDS,
  isRunning: false,
  intervalId: null
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.monsterImages || typeof parsed.monsterImages !== 'object') {
        parsed.monsterImages = {};
      }
      if (!parsed.monster) {
        parsed.monster = createMonster(1, parsed.monsterImages);
      } else {
        parsed.monster.imageUrl = getMonsterImageUrl(parsed.monster, parsed.monsterImages);
      }
      if (!Array.isArray(parsed.tags)) {
        parsed.tags = [];
      }
      if (!Array.isArray(parsed.tasks)) {
        parsed.tasks = [];
      }
      if (!Array.isArray(parsed.routines)) {
        parsed.routines = [];
      }
      parsed.tasks = parsed.tasks.map((task) => ({
        tags: [],
        ...task,
        tags: Array.isArray(task.tags) ? task.tags : []
      }));
      parsed.routines = parsed.routines.map((routine) => ({
        tags: [],
        ...routine,
        tags: Array.isArray(routine.tags) ? routine.tags : []
      }));
      return parsed;
    } catch (error) {
      console.warn('Failed to parse state', error);
    }
  }
  return {
    xp: 0,
    tasks: [],
    routines: [],
    tags: [],
    routineChecks: {},
    streak: { count: 0, lastDate: null },
    monsterImages: {},
    monster: createMonster(1, {})
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toLocaleDateString('en-CA');
}

function parseDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function daysBetween(dateStrA, dateStrB) {
  const dateA = parseDate(dateStrA);
  const dateB = parseDate(dateStrB);
  const diff = dateB.getTime() - dateA.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDisplayedStreak() {
  if (!state.streak.lastDate) return 0;
  const diff = daysBetween(state.streak.lastDate, todayKey());
  return diff <= 1 ? state.streak.count : 0;
}

function updateStreak() {
  const today = todayKey();
  if (!state.streak.lastDate) {
    state.streak.count = 1;
    state.streak.lastDate = today;
    return;
  }
  const diff = daysBetween(state.streak.lastDate, today);
  if (diff === 0) return;
  state.streak.count = diff === 1 ? state.streak.count + 1 : 1;
  state.streak.lastDate = today;
}

function addXp(amount) {
  state.xp += amount;
}

function levelFromXp(xp) {
  return Math.floor(xp / LEVEL_XP) + 1;
}

function createMonster(level, monsterImages = {}) {
  const baseHp = 120;
  const maxHp = baseHp + level * 25;
  const name = monsterNames[(level - 1) % monsterNames.length];
  const imageUrl = getMonsterImageUrl({ name }, monsterImages);
  return {
    level,
    name,
    maxHp,
    hp: maxHp,
    defeated: false,
    imageUrl
  };
}

function dealDamage(amount) {
  const monster = state.monster;
  if (monster.defeated) return;
  monster.hp = Math.max(monster.hp - amount, 0);
  if (monster.hp === 0) {
    monster.defeated = true;
    logMonster(`${monster.name} was defeated!`);
    spawnNextMonster();
  } else {
    logMonster(`${amount} damage dealt to ${monster.name}.`);
  }
}

function spawnNextMonster() {
  const nextLevel = state.monster.level + 1;
  state.monster = createMonster(nextLevel, state.monsterImages);
  logMonster(`A new foe appears: ${state.monster.name}.`);
}

function logMonster(message) {
  elements.monsterLog.textContent = message;
}

function createBadge(label, muted = false) {
  const badge = document.createElement('span');
  badge.className = `badge${muted ? ' muted' : ''}`;
  badge.textContent = label;
  return badge;
}

function getTagName(tagId) {
  const tag = state.tags.find((item) => item.id === tagId);
  return tag ? tag.name : 'Tag';
}

function render() {
  elements.xpValue.textContent = state.xp;
  const level = levelFromXp(state.xp);
  elements.levelValue.textContent = level;
  elements.streakValue.textContent = getDisplayedStreak();
  elements.monsterValue.textContent = `${state.monster.name}`;

  renderTagsManager();
  renderFilterTags();
  renderTasks();
  renderRoutines();
  renderMonster();
  renderTimer();
  saveState();
}

function renderTagsManager() {
  elements.tagsList.innerHTML = '';
  if (state.tags.length === 0) {
    elements.tagsList.innerHTML = '<li class="list-item">No tags yet. Create your first tag.</li>';
    return;
  }

  state.tags.forEach((tag) => {
    const item = document.createElement('li');
    item.className = 'list-item tag-item';

    const name = document.createElement('span');
    name.className = 'item-title';
    name.textContent = tag.name;

    const actions = document.createElement('div');
    actions.className = 'list-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn ghost';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openTagModal('edit', tag.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTag(tag.id));

    actions.append(editBtn, deleteBtn);
    item.append(name, actions);
    elements.tagsList.append(item);
  });
}

function renderFilterTags() {
  elements.filterTags.innerHTML = '';
  if (state.tags.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'helper';
    empty.textContent = 'No tags available.';
    elements.filterTags.append(empty);
    return;
  }

  state.tags.forEach((tag) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `tag-chip${filterState.tagIds.has(tag.id) ? ' active' : ''}`;
    chip.textContent = tag.name;
    chip.addEventListener('click', () => toggleFilterTag(tag.id));
    elements.filterTags.append(chip);
  });
}

function matchesFilters(item, type, isComplete) {
  if (filterState.type !== 'all' && filterState.type !== type) return false;

  if (filterState.status !== 'all') {
    if (filterState.status === 'complete' && !isComplete) return false;
    if (filterState.status === 'incomplete' && isComplete) return false;
  }

  if (filterState.query) {
    const title = String(item.title || '').toLowerCase();
    if (!title.includes(filterState.query)) return false;
  }

  if (filterState.tagIds.size > 0) {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const matchesTag = tags.some((tagId) => filterState.tagIds.has(tagId));
    if (!matchesTag) return false;
  }

  return true;
}

function renderTagOptions(selectedIds = []) {
  elements.tagOptions.innerHTML = '';
  const hasTags = state.tags.length > 0;
  elements.tagEmptyState.classList.toggle('hidden', hasTags);
  if (!hasTags) return;

  const availableIds = new Set(state.tags.map((tag) => tag.id));
  const selected = new Set(selectedIds.filter((id) => availableIds.has(id)));
  modalState.tagIds = Array.from(selected);
  state.tags.forEach((tag) => {
    const label = document.createElement('label');
    label.className = 'tag-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = tag.id;
    checkbox.checked = selected.has(tag.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selected.add(tag.id);
      } else {
        selected.delete(tag.id);
      }
      modalState.tagIds = Array.from(selected);
    });

    const text = document.createElement('span');
    text.textContent = tag.name;

    label.append(checkbox, text);
    elements.tagOptions.append(label);
  });
}

function renderTasks() {
  elements.tasksList.innerHTML = '';
  const filtered = state.tasks.filter((task) => matchesFilters(task, 'task', task.completed));
  if (state.tasks.length === 0) {
    elements.tasksList.innerHTML = '<li class="list-item">No tasks yet. Add your first quest.</li>';
    return;
  }
  if (filtered.length === 0) {
    elements.tasksList.innerHTML = '<li class="list-item">No tasks match the current filters.</li>';
    return;
  }
  filtered.forEach((task) => {
    const item = document.createElement('li');
    item.className = `list-item ${task.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id, checkbox.checked));

    const body = document.createElement('div');
    body.className = 'item-body';

    const title = document.createElement('span');
    title.className = 'item-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    if (Array.isArray(task.tags)) {
      task.tags.forEach((tagId) => {
        meta.append(createBadge(getTagName(tagId), true));
      });
    }
    if (task.source) {
      meta.append(createBadge(`Imported: ${task.source}`));
    }

    body.append(title);
    if (meta.childElementCount) {
      body.append(meta);
    }

    const actions = document.createElement('div');
    actions.className = 'list-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn ghost';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openModal('task', 'edit', task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(editBtn, deleteBtn);
    item.append(checkbox, body, actions);
    elements.tasksList.append(item);
  });
}

function renderRoutines() {
  elements.routineList.innerHTML = '';
  const today = todayKey();
  const checks = state.routineChecks[today] || {};
  if (state.routines.length === 0) {
    elements.routineList.innerHTML = '<li class="list-item">No routines yet. Add a daily habit.</li>';
    return;
  }

  const filtered = state.routines.filter((routine) => {
    const completed = Boolean(checks[routine.id]?.checked);
    return matchesFilters(routine, 'daily', completed);
  });

  if (filtered.length === 0) {
    elements.routineList.innerHTML = '<li class="list-item">No routines match the current filters.</li>';
    return;
  }

  filtered.forEach((routine) => {
    const item = document.createElement('li');
    item.className = 'list-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(checks[routine.id]?.checked);
    checkbox.addEventListener('change', () => toggleRoutine(routine.id, checkbox.checked));

    const body = document.createElement('div');
    body.className = 'item-body';

    const title = document.createElement('span');
    title.className = 'item-title';
    title.textContent = routine.title;

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    if (Array.isArray(routine.tags)) {
      routine.tags.forEach((tagId) => {
        meta.append(createBadge(getTagName(tagId), true));
      });
    }
    if (routine.timeLabel) meta.append(createBadge(routine.timeLabel, true));
    if (routine.grantXp) meta.append(createBadge(`+${XP_PER_ROUTINE} XP`));
    if (routine.grantStreak) meta.append(createBadge('Streak'));
    if (routine.source) meta.append(createBadge(`Imported: ${routine.source}`));

    body.append(title);
    if (meta.childElementCount) {
      body.append(meta);
    }

    const actions = document.createElement('div');
    actions.className = 'list-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn ghost';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openModal('routine', 'edit', routine.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteRoutine(routine.id));

    actions.append(editBtn, deleteBtn);
    item.append(checkbox, body, actions);
    elements.routineList.append(item);
  });
}

function renderMonster() {
  const monster = state.monster;
  elements.monsterName.textContent = monster.name;
  elements.monsterLevel.textContent = `Level ${monster.level}`;
  elements.monsterHpText.textContent = `${monster.hp} / ${monster.maxHp} HP`;
  elements.monsterState.textContent = monster.defeated ? 'Defeated' : 'In battle';
  const percent = (monster.hp / monster.maxHp) * 100;
  elements.monsterHpFill.style.width = `${percent}%`;

  const imageUrl = getMonsterImageUrl(monster, state.monsterImages);
  monster.imageUrl = imageUrl;
  setMonsterImages(imageUrl, monster.name);
  const hasCustom = Boolean(normalizeImageUrl(state.monsterImages?.[monster.name]));
  elements.monsterImageResetBtn.classList.toggle('hidden', !hasCustom);
}

function normalizeImageUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed;
}

function getDefaultMonsterImageUrl(name) {
  return DEFAULT_MONSTER_IMAGES[name] || PLACEHOLDER_MONSTER_IMAGE;
}

function getMonsterImageUrl(monster, monsterImages) {
  const name = String(monster?.name || '').trim();
  const direct = normalizeImageUrl(monster?.imageUrl);
  if (direct) return direct;
  const custom = normalizeImageUrl(monsterImages?.[name]);
  if (custom) return custom;
  return getDefaultMonsterImageUrl(name);
}

function setMonsterImages(src, monsterName) {
  const fallback = PLACEHOLDER_MONSTER_IMAGE;
  const safeSrc = normalizeImageUrl(src) || fallback;
  const absFallback = new URL(fallback, window.location.href).href;
  const absSrc = new URL(safeSrc, window.location.href).href;

  const apply = (img) => {
    if (!img) return;
    img.alt = monsterName ? `${monsterName}` : 'Monster';
    img.onerror = null;
    img.src = absSrc;
    img.onerror = () => {
      if (img.src === absFallback) return;
      img.onerror = null;
      img.src = absFallback;
    };
  };

  apply(elements.monsterImage);
  apply(elements.monsterBattleImage);
}

function handleMonsterImageUpload(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (!ALLOWED_MONSTER_IMAGE_TYPES.has(file.type)) {
    showToast('Upload a PNG, JPG, or WebP image.');
    return;
  }

  if (file.size > MAX_MONSTER_IMAGE_BYTES) {
    showToast('Image too large (max ~900 KB).');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = normalizeImageUrl(reader.result);
    if (!dataUrl) {
      showToast('Failed to read image.');
      return;
    }
    const name = state.monster?.name;
    if (!name) return;
    if (!state.monsterImages || typeof state.monsterImages !== 'object') state.monsterImages = {};
    state.monsterImages[name] = dataUrl;
    state.monster.imageUrl = dataUrl;
    showToast('Monster image updated.');
    render();
  };
  reader.onerror = () => showToast('Failed to read image.');
  reader.readAsDataURL(file);
}

function resetMonsterImage() {
  const name = state.monster?.name;
  if (!name) return;
  if (state.monsterImages && typeof state.monsterImages === 'object') {
    delete state.monsterImages[name];
  }
  state.monster.imageUrl = getDefaultMonsterImageUrl(name);
  showToast('Monster image reset.');
  render();
}

function renderTimer() {
  elements.timerLabel.textContent = pomodoro.mode === 'work' ? 'Focus' : 'Break';
  elements.timerDisplay.textContent = formatTime(pomodoro.remaining);
  elements.timerNote.textContent = pomodoro.mode === 'work'
    ? 'Stay locked in for 20 minutes.'
    : 'Recharge for 5 minutes.';
  elements.startPauseBtn.textContent = pomodoro.isRunning ? 'Pause' : 'Start';
}

function toggleTask(taskId, completed) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.completed = completed;

  if (completed && !task.xpGranted) {
    task.xpGranted = true;
    addXp(XP_PER_TASK);
    updateStreak();
    dealDamage(TASK_DAMAGE);
    showToast(`+${XP_PER_TASK} XP`);
  }
  render();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  render();
}

function toggleRoutine(routineId, checked) {
  const routine = state.routines.find((item) => item.id === routineId);
  if (!routine) return;
  const today = todayKey();
  if (!state.routineChecks[today]) state.routineChecks[today] = {};
  if (!state.routineChecks[today][routineId]) state.routineChecks[today][routineId] = {};

  const record = state.routineChecks[today][routineId];
  record.checked = checked;

  if (checked && !record.xpGranted && routine.grantXp) {
    record.xpGranted = true;
    addXp(XP_PER_ROUTINE);
    dealDamage(ROUTINE_DAMAGE);
    showToast(`+${XP_PER_ROUTINE} XP`);
  }
  if (checked && routine.grantStreak) {
    updateStreak();
  }
  render();
}

function deleteRoutine(routineId) {
  state.routines = state.routines.filter((item) => item.id !== routineId);
  render();
}

function openModal(type, mode, id = null) {
  modalState.type = type;
  modalState.mode = mode;
  modalState.id = id;

  const isRoutine = type === 'routine';
  elements.routineToggles.classList.toggle('hidden', !isRoutine);
  elements.modalTitle.textContent = `${mode === 'add' ? 'New' : 'Edit'} ${isRoutine ? 'Routine Item' : 'Task'}`;

  if (mode === 'edit') {
    const item = isRoutine
      ? state.routines.find((routine) => routine.id === id)
      : state.tasks.find((task) => task.id === id);
    elements.modalInput.value = item ? item.title : '';
    modalState.tagIds = item?.tags ? [...item.tags] : [];
    if (isRoutine && item) {
      elements.routineXpToggle.checked = Boolean(item.grantXp);
      elements.routineStreakToggle.checked = Boolean(item.grantStreak);
    }
  } else {
    elements.modalInput.value = '';
    modalState.tagIds = [];
    elements.routineXpToggle.checked = true;
    elements.routineStreakToggle.checked = true;
  }

  renderTagOptions(modalState.tagIds);
  elements.modal.classList.remove('hidden');
  elements.modalInput.focus();
}

function closeModal() {
  elements.modal.classList.add('hidden');
}

function saveModal() {
  const title = elements.modalInput.value.trim();
  if (!title) return;

  if (modalState.type === 'task') {
    if (modalState.mode === 'add') {
      state.tasks.unshift({
        id: crypto.randomUUID(),
        title,
        completed: false,
        xpGranted: false,
        tags: [...modalState.tagIds]
      });
    } else {
      const task = state.tasks.find((item) => item.id === modalState.id);
      if (task) {
        task.title = title;
        task.tags = [...modalState.tagIds];
      }
    }
  } else {
    const grantXp = elements.routineXpToggle.checked;
    const grantStreak = elements.routineStreakToggle.checked;

    if (modalState.mode === 'add') {
      state.routines.unshift({
        id: crypto.randomUUID(),
        title,
        grantXp,
        grantStreak,
        tags: [...modalState.tagIds]
      });
    } else {
      const routine = state.routines.find((item) => item.id === modalState.id);
      if (routine) {
        routine.title = title;
        routine.grantXp = grantXp;
        routine.grantStreak = grantStreak;
        routine.tags = [...modalState.tagIds];
      }
    }
  }

  closeModal();
  render();
}

function openImportModal(type) {
  importState.type = type;
  const isHabitica = type === 'habitica';
  elements.importTitle.textContent = isHabitica ? 'Import from Habitica' : 'Import from TimeBlock';
  elements.habiticaFields.classList.toggle('hidden', !isHabitica);
  elements.timeblockFields.classList.toggle('hidden', isHabitica);
  setImportStatus('');
  elements.importModal.classList.remove('hidden');

  if (isHabitica) {
    if (!elements.habiticaClient.value && elements.habiticaUserId.value.trim()) {
      elements.habiticaClient.value = `${elements.habiticaUserId.value.trim()}-QuestFlow`;
    }
    elements.habiticaUserId.focus();
  } else {
    elements.timeblockInput.focus();
  }
}

function closeImportModal() {
  elements.importModal.classList.add('hidden');
}

function setImportStatus(message, isError = false) {
  elements.importStatus.textContent = message;
  elements.importStatus.style.color = isError ? '#a9330a' : '';
}

function openTagModal(mode, id = null) {
  tagModalState.mode = mode;
  tagModalState.id = id;
  elements.tagModalTitle.textContent = mode === 'add' ? 'New Tag' : 'Edit Tag';
  if (mode === 'edit') {
    const tag = state.tags.find((item) => item.id === id);
    elements.tagNameInput.value = tag ? tag.name : '';
  } else {
    elements.tagNameInput.value = '';
  }
  elements.tagModal.classList.remove('hidden');
  elements.tagNameInput.focus();
}

function closeTagModal() {
  elements.tagModal.classList.add('hidden');
}

function saveTag() {
  const name = elements.tagNameInput.value.trim();
  if (!name) {
    showToast('Enter a tag name.');
    return;
  }

  const duplicate = state.tags.find(
    (tag) => tag.name.toLowerCase() === name.toLowerCase() && tag.id !== tagModalState.id
  );
  if (duplicate) {
    showToast('Tag already exists.');
    return;
  }

  if (tagModalState.mode === 'add') {
    state.tags.unshift({ id: crypto.randomUUID(), name });
  } else {
    const tag = state.tags.find((item) => item.id === tagModalState.id);
    if (tag) tag.name = name;
  }
  closeTagModal();
  render();
}

function deleteTag(tagId) {
  const tag = state.tags.find((item) => item.id === tagId);
  if (!tag) return;
  const confirmed = window.confirm(`Delete the tag \"${tag.name}\"?`);
  if (!confirmed) return;

  state.tags = state.tags.filter((item) => item.id !== tagId);
  state.tasks = state.tasks.map((task) => ({
    ...task,
    tags: Array.isArray(task.tags) ? task.tags.filter((id) => id !== tagId) : []
  }));
  state.routines = state.routines.map((routine) => ({
    ...routine,
    tags: Array.isArray(routine.tags) ? routine.tags.filter((id) => id !== tagId) : []
  }));
  filterState.tagIds.delete(tagId);
  render();
}

function toggleFilterTag(tagId) {
  if (filterState.tagIds.has(tagId)) {
    filterState.tagIds.delete(tagId);
  } else {
    filterState.tagIds.add(tagId);
  }
  render();
}

function clearFilters() {
  filterState.query = '';
  filterState.type = 'all';
  filterState.status = 'all';
  filterState.tagIds.clear();
  elements.searchInput.value = '';
  elements.filterType.value = 'all';
  elements.filterStatus.value = 'all';
  render();
}

async function handleHabiticaImport() {
  const userId = elements.habiticaUserId.value.trim();
  const apiToken = elements.habiticaApiToken.value.trim();
  const includeTodos = elements.habiticaTodosToggle.checked;
  const includeDailies = elements.habiticaDailiesToggle.checked;

  if (!userId || !apiToken) {
    setImportStatus('Enter your Habitica User ID and API Token.', true);
    return;
  }

  if (!includeTodos && !includeDailies) {
    setImportStatus('Select at least one task type to import.', true);
    return;
  }

  const clientHeader = elements.habiticaClient.value.trim() || `${userId}-QuestFlow`;
  elements.confirmImportBtn.disabled = true;
  setImportStatus('Fetching tasks from Habitica...');

  try {
    const response = await fetch(`${HABITICA_API_BASE}/tasks/user`, {
      headers: {
        'x-api-user': userId,
        'x-api-key': apiToken,
        'x-client': clientHeader
      }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = payload?.message || response.statusText || 'Import failed.';
      setImportStatus(errorMessage, true);
      return;
    }

    const tasks = Array.isArray(payload.data) ? payload.data : [];
    const allowedTypes = new Set();
    if (includeTodos) allowedTypes.add('todo');
    if (includeDailies) allowedTypes.add('daily');

    const existingIds = new Set(
      state.tasks.filter((task) => task.source === 'Habitica' && task.sourceId).map((task) => task.sourceId)
    );

    const newTasks = [];
    let skipped = 0;
    tasks.forEach((task) => {
      if (!allowedTypes.has(task.type)) return;
      if (task.completed) return;
      const sourceId = task.id || task._id;
      if (sourceId && existingIds.has(sourceId)) {
        skipped += 1;
        return;
      }
      const title = task.text || task.title || 'Untitled Habitica Task';
      newTasks.push({
        id: crypto.randomUUID(),
        title,
        completed: false,
        xpGranted: false,
        tags: [],
        source: 'Habitica',
        sourceId
      });
    });

    if (newTasks.length) {
      state.tasks = newTasks.concat(state.tasks);
      showToast(`Imported ${newTasks.length} Habitica tasks`);
      render();
    }

    setImportStatus(`Imported ${newTasks.length} tasks. Skipped ${skipped} already added.`);
  } catch (error) {
    console.error(error);
    setImportStatus('Network error while importing Habitica tasks.', true);
  } finally {
    elements.confirmImportBtn.disabled = false;
  }
}

function handleTimeblockImport() {
  const raw = elements.timeblockInput.value.trim();
  if (!raw) {
    setImportStatus('Paste or upload TimeBlock data to import.', true);
    return;
  }

  const blocks = parseTimeblockData(raw);
  if (!blocks.length) {
    setImportStatus('No routines found in the provided data.', true);
    return;
  }

  const grantXp = elements.timeblockXpToggle.checked;
  const grantStreak = elements.timeblockStreakToggle.checked;
  const existingIds = new Set(
    state.routines
      .filter((routine) => routine.source === 'TimeBlock' && routine.sourceId)
      .map((routine) => routine.sourceId)
  );

  const newRoutines = [];
  let skipped = 0;
  blocks.forEach((block, index) => {
    const title = String(block.title || block.name || block.label || block.task || block.activity || '').trim();
    if (!title) return;

    const timeLabel = buildTimeLabel(block);
    const sourceId = String(block.id || block._id || `${title}-${timeLabel}-${index}`);
    if (existingIds.has(sourceId)) {
      skipped += 1;
      return;
    }

    newRoutines.push({
      id: crypto.randomUUID(),
      title,
      grantXp,
      grantStreak,
      tags: [],
      timeLabel,
      source: 'TimeBlock',
      sourceId
    });
  });

  if (newRoutines.length) {
    state.routines = newRoutines.concat(state.routines);
    showToast(`Imported ${newRoutines.length} routine items`);
    render();
  }

  setImportStatus(`Imported ${newRoutines.length} routines. Skipped ${skipped} already added.`);
}

function parseTimeblockData(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.blocks)) return parsed.blocks;
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.data)) return parsed.data;
    if (parsed.schedule && Array.isArray(parsed.schedule.blocks)) return parsed.schedule.blocks;
    return [];
  } catch (error) {
    // Fall through to CSV parsing
  }

  return parseCsv(raw);
}

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });
    return entry;
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeTime(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    const hours = Math.floor(value / 60);
    const minutes = Math.floor(value % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const str = String(value).trim();
  if (!str) return '';
  const timeMatch = str.match(/(\\d{1,2}):(\\d{2})/);
  if (timeMatch) {
    const hours = String(timeMatch[1]).padStart(2, '0');
    return `${hours}:${timeMatch[2]}`;
  }
  const parsedDate = new Date(str);
  if (!Number.isNaN(parsedDate.getTime())) {
    return `${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
  }
  return str;
}

function buildTimeLabel(block) {
  const start = normalizeTime(block.start || block.startTime || block.from || block.begin);
  const end = normalizeTime(block.end || block.endTime || block.to || block.finish);
  const time = String(block.time || block.timeLabel || '').trim();
  let label = '';
  if (start && end) label = `${start}-${end}`;
  else if (start) label = start;
  else if (time) label = time;

  const day = block.day || block.date || block.weekday;
  if (day) {
    label = label ? `${label} | ${day}` : String(day);
  }
  return label;
}

function handleTimeblockFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    elements.timeblockInput.value = String(reader.result || '');
    setImportStatus('Loaded file. Ready to import.');
  };
  reader.onerror = () => {
    setImportStatus('Failed to read file.', true);
  };
  reader.readAsText(file);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function toggleTimer() {
  pomodoro.isRunning = !pomodoro.isRunning;
  if (pomodoro.isRunning) {
    pomodoro.intervalId = setInterval(() => {
      pomodoro.remaining -= 1;
      if (pomodoro.remaining <= 0) {
        pomodoro.remaining = 0;
        handleTimerEnd();
      }
      renderTimer();
    }, 1000);
  } else {
    clearInterval(pomodoro.intervalId);
  }
  renderTimer();
}

function resetTimer() {
  clearInterval(pomodoro.intervalId);
  pomodoro.isRunning = false;
  pomodoro.mode = 'work';
  pomodoro.remaining = WORK_SECONDS;
  renderTimer();
}

function skipTimer() {
  clearInterval(pomodoro.intervalId);
  pomodoro.isRunning = false;
  pomodoro.remaining = 0;
  handleTimerEnd();
}

function handleTimerEnd() {
  clearInterval(pomodoro.intervalId);
  pomodoro.isRunning = false;
  const nextMode = pomodoro.mode === 'work' ? 'break' : 'work';
  pomodoro.mode = nextMode;
  pomodoro.remaining = nextMode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  const message = nextMode === 'work' ? 'Break over. Time to focus.' : 'Focus session complete. Take a break.';
  sendNotification(message);
  showToast(message);
  renderTimer();
}

function sendNotification(message) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('QuestFlow', { body: message });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('QuestFlow', { body: message });
      }
    });
  }
}

let toastTimeout;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => elements.toast.classList.add('hidden'), 2400);
}

function bindEvents() {
  elements.addTaskBtn.addEventListener('click', () => openModal('task', 'add'));
  elements.addRoutineBtn.addEventListener('click', () => openModal('routine', 'add'));
  elements.importHabiticaBtn.addEventListener('click', () => openImportModal('habitica'));
  elements.importTimeblockBtn.addEventListener('click', () => openImportModal('timeblock'));
  elements.addTagBtn.addEventListener('click', () => openTagModal('add'));
  elements.cancelModalBtn.addEventListener('click', closeModal);
  elements.saveModalBtn.addEventListener('click', saveModal);
  elements.modal.addEventListener('click', (event) => {
    if (event.target === elements.modal) closeModal();
  });
  elements.cancelImportBtn.addEventListener('click', closeImportModal);
  elements.confirmImportBtn.addEventListener('click', () => {
    if (importState.type === 'habitica') {
      handleHabiticaImport();
    } else {
      handleTimeblockImport();
    }
  });
  elements.importModal.addEventListener('click', (event) => {
    if (event.target === elements.importModal) closeImportModal();
  });
  elements.timeblockFile.addEventListener('change', handleTimeblockFile);
  elements.habiticaUserId.addEventListener('input', () => {
    if (!elements.habiticaClient.value.trim()) {
      const trimmed = elements.habiticaUserId.value.trim();
      if (trimmed) elements.habiticaClient.value = `${trimmed}-QuestFlow`;
    }
  });
  elements.searchInput.addEventListener('input', () => {
    filterState.query = elements.searchInput.value.trim().toLowerCase();
    render();
  });
  elements.filterType.addEventListener('change', () => {
    filterState.type = elements.filterType.value;
    render();
  });
  elements.filterStatus.addEventListener('change', () => {
    filterState.status = elements.filterStatus.value;
    render();
  });
  elements.clearFiltersBtn.addEventListener('click', clearFilters);
  elements.cancelTagBtn.addEventListener('click', closeTagModal);
  elements.saveTagBtn.addEventListener('click', saveTag);
  elements.tagModal.addEventListener('click', (event) => {
    if (event.target === elements.tagModal) closeTagModal();
  });
  elements.startPauseBtn.addEventListener('click', toggleTimer);
  elements.resetBtn.addEventListener('click', resetTimer);
  elements.skipBtn.addEventListener('click', skipTimer);

  elements.monsterImageBtn.addEventListener('click', () => elements.monsterImageInput.click());
  elements.monsterImageInput.addEventListener('change', handleMonsterImageUpload);
  elements.monsterImageResetBtn.addEventListener('click', resetMonsterImage);
}

bindEvents();
render();

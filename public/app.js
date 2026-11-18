const state = {
  profiles: [],
  currentIndex: 0,
  activeTab: "discover",
  isBusy: false,
  drag: null
};

const elements = {
  tabs: [...document.querySelectorAll(".tab")],
  homeView: document.getElementById("home-view"),
  discoverView: document.getElementById("discover-view"),
  matchesView: document.getElementById("matches-view"),
  card: document.getElementById("profile-card"),
  photo: document.getElementById("profile-photo"),
  name: document.getElementById("profile-name"),
  age: document.getElementById("profile-age"),
  city: document.getElementById("profile-city"),
  bio: document.getElementById("profile-bio"),
  interests: document.getElementById("profile-interests"),
  feedArea: document.getElementById("feed-area"),
  emptyState: document.getElementById("empty-state"),
  remaining: document.getElementById("remaining-count"),
  matchCount: document.getElementById("match-count"),
  matchesTotal: document.getElementById("matches-total"),
  matchesList: document.getElementById("matches-list"),
  matchesEmpty: document.getElementById("matches-empty"),
  modal: document.getElementById("match-modal"),
  toast: document.getElementById("toast")
};

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The request could not be completed.");
  }
  return data;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2300);
}

function setTab(tabName) {
  state.activeTab = tabName;
  elements.tabs.forEach((tab) => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-current", active ? "page" : "false");
  });
  elements.homeView.classList.toggle("hidden", tabName !== "home");
  elements.discoverView.classList.toggle("hidden", tabName !== "discover");
  elements.matchesView.classList.toggle("hidden", tabName !== "matches");
  if (tabName === "matches") loadMatches();
}

function currentProfile() {
  return state.profiles[state.currentIndex] || null;
}

function renderProfile() {
  const profile = currentProfile();
  const total = state.profiles.length - state.currentIndex;
  elements.remaining.textContent = `${total} ${total === 1 ? "profile" : "profiles"} left`;

  if (!profile) {
    elements.card.classList.add("hidden");
    elements.emptyState.classList.remove("hidden");
    return;
  }

  elements.emptyState.classList.add("hidden");
  elements.card.classList.remove("hidden");
  elements.card.classList.remove("exit-left", "exit-right");
  elements.photo.src = profile.photo;
  elements.photo.alt = `Portrait of ${profile.name}`;
  elements.name.textContent = profile.name;
  elements.age.textContent = profile.age;
  elements.city.textContent = profile.city;
  elements.bio.textContent = profile.bio;
  elements.interests.replaceChildren();

  profile.interests.forEach((interest) => {
    const chip = document.createElement("span");
    chip.className = "interest";
    chip.textContent = interest;
    elements.interests.appendChild(chip);
  });
}

async function loadFeed() {
  const data = await api("/feed");
  state.profiles = data.profiles;
  state.currentIndex = 0;
  renderProfile();
}

async function updateMatchCount() {
  const data = await api("/matches");
  elements.matchCount.textContent = data.matches.length;
}

async function loadMatches() {
  try {
    const data = await api("/matches");
    const matches = data.matches;
    elements.matchCount.textContent = matches.length;
    elements.matchesTotal.textContent = `${matches.length} ${matches.length === 1 ? "connection" : "connections"}`;
    elements.matchesList.replaceChildren();
    elements.matchesEmpty.classList.toggle("hidden", matches.length > 0);

    matches.forEach((match) => {
      const card = document.createElement("article");
      card.className = "match-card";

      const image = document.createElement("img");
      image.src = match.photo;
      image.alt = `Portrait of ${match.name}`;

      const details = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = `${match.name}, ${match.age}`;
      const city = document.createElement("p");
      city.textContent = match.city;
      details.append(name, city);

      const tag = document.createElement("span");
      tag.className = "match-tag";
      tag.textContent = "MUTUAL";

      card.append(image, details, tag);
      elements.matchesList.appendChild(card);
    });
  } catch (error) {
    showToast(error.message);
  }
}

function openMatch(profile) {
  document.getElementById("match-avatar").src = profile.photo;
  document.getElementById("match-avatar").alt = `Portrait of ${profile.name}`;
  document.getElementById("match-name").textContent = `${profile.name}, ${profile.age}`;
  elements.modal.classList.remove("hidden");
  document.getElementById("close-match").focus();
}

function closeMatch() {
  elements.modal.classList.add("hidden");
}

async function swipe(action) {
  if (state.isBusy) return;
  const profile = currentProfile();
  if (!profile) return;

  state.isBusy = true;
  const card = elements.card;
  card.classList.add(action === "like" ? "exit-right" : "exit-left");

  try {
    const result = await api("/swipe", {
      method: "POST",
      body: JSON.stringify({ profileId: profile.id, action })
    });

    state.currentIndex += 1;
    await updateMatchCount();

    if (result.matched && result.match) {
      renderProfile();
      openMatch(result.match);
    } else {
      renderProfile();
      showToast(action === "like" ? "Like sent" : "Passed");
    }
  } catch (error) {
    card.classList.remove("exit-left", "exit-right");
    showToast(error.message);
    await loadFeed();
  } finally {
    state.isBusy = false;
  }
}

function resetDrag() {
  state.drag = null;
  elements.card.classList.remove("dragging");
  elements.card.style.transform = "";
}

function onPointerDown(event) {
  if (!currentProfile() || state.isBusy || event.target.closest("button")) return;
  state.drag = { startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 };
  elements.card.classList.add("dragging");
  elements.card.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (!state.drag) return;
  state.drag.dx = event.clientX - state.drag.startX;
  state.drag.dy = event.clientY - state.drag.startY;
  const rotation = state.drag.dx / 18;
  elements.card.style.transform = `translate(${state.drag.dx}px, ${state.drag.dy * 0.25}px) rotate(${rotation}deg)`;
}

function onPointerUp() {
  if (!state.drag) return;
  const dx = state.drag.dx;
  resetDrag();
  if (dx > 105) swipe("like");
  else if (dx < -105) swipe("pass");
}

function bindEvents() {
  elements.tabs.forEach((tab) => tab.addEventListener("click", () => setTab(tab.dataset.tab)));
  document.getElementById("like-button").addEventListener("click", () => swipe("like"));
  document.getElementById("pass-button").addEventListener("click", () => swipe("pass"));
  document.getElementById("go-discover-button").addEventListener("click", () => setTab("discover"));
  document.getElementById("close-match").addEventListener("click", closeMatch);
  document.getElementById("keep-discovering-button").addEventListener("click", closeMatch);
  document.getElementById("see-matches-button").addEventListener("click", () => {
    closeMatch();
    setTab("matches");
  });
  elements.modal.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) closeMatch();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMatch();
    if (state.activeTab === "discover" && elements.modal.classList.contains("hidden")) {
      if (event.key === "ArrowLeft") swipe("pass");
      if (event.key === "ArrowRight") swipe("like");
    }
  });

  elements.card.addEventListener("pointerdown", onPointerDown);
  elements.card.addEventListener("pointermove", onPointerMove);
  elements.card.addEventListener("pointerup", onPointerUp);
  elements.card.addEventListener("pointercancel", onPointerUp);

  async function reset() {
    if (!confirm("Reset all demo swipes and matches? This cannot be undone.")) return;
    try {
      await api("/api/demo/reset", { method: "POST", body: "{}" });
      await loadFeed();
      await updateMatchCount();
      await loadMatches();
      setTab("discover");
      showToast("Demo has been reset.");
    } catch (error) {
      showToast(error.message);
    }
  }
  document.getElementById("reset-button").addEventListener("click", reset);
  document.getElementById("empty-reset-button").addEventListener("click", reset);
}

async function init() {
  bindEvents();
  try {
    await loadFeed();
    await updateMatchCount();
  } catch (error) {
    showToast(error.message);
    console.error(error);
  }
}

init();

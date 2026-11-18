const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "store.json");
const CURRENT_USER_ID = "demo-user";

const seedProfiles = [
  ["p01", "Aarohi", 22, "Delhi", "Photography, travel and finding tiny cafés.", ["Photography", "Travel", "Coffee"], 1, true],
  ["p02", "Kabir", 24, "Gurugram", "Weekend cyclist. Weekday product designer.", ["Cycling", "Design", "Movies"], 2, false],
  ["p03", "Meera", 23, "Chandigarh", "Books, long walks and spontaneous plans.", ["Books", "Nature", "Music"], 3, true],
  ["p04", "Ishaan", 25, "Delhi", "Learning guitar one chord at a time.", ["Music", "Food", "Fitness"], 4, false],
  ["p05", "Sana", 22, "Jaipur", "Art museums and sunsets are my thing.", ["Art", "Travel", "Cooking"], 5, false],
  ["p06", "Reyansh", 26, "Noida", "Coffee enthusiast and amateur runner.", ["Running", "Coffee", "Technology"], 6, false],
  ["p07", "Ananya", 21, "Delhi", "Collecting memories, not things.", ["Dance", "Travel", "Photography"], 7, true],
  ["p08", "Vihaan", 23, "Pune", "I make playlists for every occasion.", ["Music", "Gaming", "Food"], 8, false],
  ["p09", "Tara", 24, "Mumbai", "Ocean person living in a city.", ["Beach", "Fitness", "Films"], 9, false],
  ["p10", "Arjun", 25, "Bengaluru", "Startup stories and Sunday brunch.", ["Startups", "Books", "Coffee"], 10, false],
  ["p11", "Diya", 22, "Lucknow", "Doodling my way through life.", ["Illustration", "Food", "Travel"], 11, false],
  ["p12", "Aditya", 24, "Gurugram", "Badminton, biryani and better conversations.", ["Badminton", "Food", "Comedy"], 12, true],
  ["p13", "Riya", 23, "Dehradun", "Mountains make everything better.", ["Hiking", "Nature", "Books"], 13, false],
  ["p14", "Ayaan", 22, "Delhi", "Aspiring chef. Professional taste tester.", ["Cooking", "Movies", "Fitness"], 14, false],
  ["p15", "Naina", 25, "Hyderabad", "Exploring new places and new ideas.", ["Travel", "Technology", "Art"], 15, false],
  ["p16", "Dev", 26, "Mumbai", "Football is my whole personality.", ["Football", "Fitness", "Music"], 16, false],
  ["p17", "Ira", 21, "Jaipur", "A little bit of everything, mostly art.", ["Art", "Dance", "Books"], 17, false],
  ["p18", "Rohan", 24, "Chandigarh", "Always up for a road trip.", ["Road trips", "Photography", "Food"], 18, true],
  ["p19", "Myra", 23, "Pune", "Plant parent and amateur baker.", ["Plants", "Baking", "Movies"], 19, false],
  ["p20", "Kunal", 25, "Noida", "Tech by day, trivia by night.", ["Technology", "Trivia", "Gaming"], 20, false],
  ["p21", "Zoya", 22, "Delhi", "Dance floors and dessert menus.", ["Dance", "Dessert", "Travel"], 21, false],
  ["p22", "Neil", 24, "Bengaluru", "Into indie music and indie games.", ["Gaming", "Music", "Coffee"], 22, false],
  ["p23", "Kiara", 26, "Mumbai", "Finding beauty in ordinary days.", ["Photography", "Yoga", "Books"], 23, false],
  ["p24", "Samar", 23, "Lucknow", "Cricket, cinema and conversations.", ["Cricket", "Films", "Food"], 24, false],
  ["p25", "Aditi", 22, "Gurugram", "Trying every café at least once.", ["Coffee", "Food", "Reading"], 25, true],
  ["p26", "Manav", 27, "Delhi", "Marathons are my kind of therapy.", ["Running", "Travel", "Fitness"], 26, false],
  ["p27", "Pihu", 21, "Dehradun", "Poetry, sunsets and slow mornings.", ["Poetry", "Nature", "Music"], 27, false],
  ["p28", "Dhruv", 24, "Jaipur", "History nerd with a camera.", ["History", "Photography", "Travel"], 28, false],
  ["p29", "Simran", 25, "Hyderabad", "Making things, breaking things, learning.", ["Design", "Technology", "Art"], 29, false],
  ["p30", "Yash", 23, "Pune", "My dog has better social skills.", ["Pets", "Comedy", "Hiking"], 30, false]
];

function makeSeedState() {
  return {
    currentUserId: CURRENT_USER_ID,
    profiles: seedProfiles.map(([id, name, age, city, bio, interests, photo, likedUser]) => ({
      id,
      name,
      age,
      city,
      bio,
      interests,
      photo: `https://i.pravatar.cc/700?img=${photo}`,
      likedUser
    })),
    swipes: [],
    matches: []
  };
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    writeState(makeSeedState());
  }
}

function readState() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tempFile, DB_FILE);
}

function publicProfile(profile) {
  // Never send likedUser to the browser: it would disclose incoming likes.
  const { likedUser, ...safeProfile } = profile;
  return safeProfile;
}

function getFeed() {
  const state = readState();
  const swipedIds = new Set(
    state.swipes
      .filter((swipe) => swipe.userId === CURRENT_USER_ID)
      .map((swipe) => swipe.profileId)
  );

  return state.profiles
    .filter((profile) => !swipedIds.has(profile.id))
    .map(publicProfile);
}

function recordSwipe(profileId, action) {
  if (typeof profileId !== "string" || !profileId.trim()) {
    const error = new Error("A valid profileId is required.");
    error.status = 400;
    throw error;
  }

  if (!["like", "pass"].includes(action)) {
    const error = new Error('Action must be either "like" or "pass".');
    error.status = 400;
    throw error;
  }

  const state = readState();
  const profile = state.profiles.find((item) => item.id === profileId);

  if (!profile) {
    const error = new Error("Profile not found.");
    error.status = 404;
    throw error;
  }

  const alreadySwiped = state.swipes.some(
    (swipe) => swipe.userId === CURRENT_USER_ID && swipe.profileId === profileId
  );

  if (alreadySwiped) {
    const error = new Error("You have already swiped on this profile.");
    error.status = 409;
    throw error;
  }

  state.swipes.push({
    userId: CURRENT_USER_ID,
    profileId,
    action,
    createdAt: new Date().toISOString()
  });

  // A match is created only when this user likes a profile that has
  // independently liked the current user. Incoming likes are never exposed.
  let match = null;
  if (action === "like" && profile.likedUser === true) {
    const exists = state.matches.some((item) => item.profileId === profileId);
    if (!exists) {
      match = {
        id: `match-${profileId}`,
        profileId,
        createdAt: new Date().toISOString()
      };
      state.matches.push(match);
    } else {
      match = state.matches.find((item) => item.profileId === profileId);
    }
  }

  writeState(state);

  return {
    success: true,
    action,
    matched: Boolean(match),
    match: match ? publicProfile(profile) : null,
    remaining: state.profiles.length - state.swipes.filter(
      (swipe) => swipe.userId === CURRENT_USER_ID
    ).length
  };
}

function getMatches() {
  const state = readState();
  return state.matches
    .map((match) => {
      const profile = state.profiles.find((item) => item.id === match.profileId);
      if (!profile) return null;
      return {
        ...publicProfile(profile),
        matchedAt: match.createdAt
      };
    })
    .filter(Boolean);
}

function resetDemo() {
  writeState(makeSeedState());
}

module.exports = { getFeed, recordSwipe, getMatches, resetDemo };

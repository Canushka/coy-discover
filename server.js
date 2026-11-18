const express = require("express");
const path = require("path");
const {
  getFeed,
  recordSwipe,
  getMatches,
  resetDemo
} = require("./src/store");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

function handleError(res, error) {
  const status = error.status || 500;
  res.status(status).json({
    error: error.message || "Something went wrong."
  });
}

// The assignment asks for these exact routes.
app.get("/feed", (req, res) => {
  try {
    res.json({ profiles: getFeed() });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/swipe", (req, res) => {
  try {
    const { profileId, action } = req.body || {};
    const result = recordSwipe(profileId, action);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/matches", (req, res) => {
  try {
    res.json({ matches: getMatches() });
  } catch (error) {
    handleError(res, error);
  }
});

// Friendly aliases used by the frontend.
app.get("/api/feed", (req, res) => res.json({ profiles: getFeed() }));
app.post("/api/swipe", (req, res) => {
  try {
    const { profileId, action } = req.body || {};
    res.status(201).json(recordSwipe(profileId, action));
  } catch (error) {
    handleError(res, error);
  }
});
app.get("/api/matches", (req, res) => res.json({ matches: getMatches() }));

// Local-only demo reset. Do not expose this endpoint in a production deployment.
app.post("/api/demo/reset", (req, res) => {
  try {
    resetDemo();
    res.json({ message: "Demo data reset.", profiles: getFeed().length });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Coy Discover API is running." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Coy Discover is running at http://localhost:${PORT}\n`);
});

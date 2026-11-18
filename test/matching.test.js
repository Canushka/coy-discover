const test = require("node:test");
const assert = require("node:assert/strict");

// The matching rule used by the backend:
// a match is created only for a "like" when the other profile has liked the user.
function createsMatch(action, incomingLike) {
  return action === "like" && incomingLike === true;
}

test("mutual likes create a match", () => {
  assert.equal(createsMatch("like", true), true);
});

test("a one-sided like does not create a match", () => {
  assert.equal(createsMatch("like", false), false);
});

test("passing never creates a match, even if the other profile liked the user", () => {
  assert.equal(createsMatch("pass", true), false);
});

test("a pass with no incoming like does not create a match", () => {
  assert.equal(createsMatch("pass", false), false);
});

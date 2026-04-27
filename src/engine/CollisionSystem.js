/**
 * AABB collision detection between entity groups.
 * Entities need: x, y, w, h, alive properties.
 */

export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Check all entities in groupA against all in groupB.
 * Calls onHit(a, b) for each colliding pair.
 * Only checks alive entities.
 */
export function checkGroups(groupA, groupB, onHit) {
  for (const a of groupA) {
    if (!a.alive) continue;
    for (const b of groupB) {
      if (!b.alive) continue;
      if (aabb(a, b)) onHit(a, b);
    }
  }
}

/**
 * Check a single entity against a group.
 */
export function checkOne(entity, group, onHit) {
  if (!entity.alive) return;
  for (const b of group) {
    if (!b.alive) continue;
    if (aabb(entity, b)) onHit(entity, b);
  }
}

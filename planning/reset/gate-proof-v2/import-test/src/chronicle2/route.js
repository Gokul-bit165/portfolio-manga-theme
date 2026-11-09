// Chronicle V2's addresses. Every view has one, so Back, Forward and shared links work:
//   #map                  the Chronicle map, over wherever the visitor is
//   #project/<id>         standing before that project's standard, its note open
//   #project/<id>/folio   the project's full folio
//   #read/<chapter>       a chapter's page, opened on request
//   #<chapter>            the journey's own chapter links (unchanged)
export function routeOf(h) {
  const p = /^#project\/([\w-]+)(\/folio)?$/.exec(h), r = /^#read\/([\w-]+)$/.exec(h);
  return h === "#map" ? { kind: "map" } : p ? { kind: "project", id: p[1], folio: !!p[2] } : r ? { kind: "read", id: r[1] } : { kind: "chapter" };
}
// The chapter a link must start the journey in.
export function chapterHash2(h) { const r = routeOf(h); return r.kind === "project" ? "#muster" : r.kind === "read" ? `#${r.id}` : h; }

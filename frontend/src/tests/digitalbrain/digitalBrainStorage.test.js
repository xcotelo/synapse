import {
  loadNotes,
  saveNotes,
  loadInbox,
  saveInbox,
  extractFirstUrl,
  extractYouTubeId,
  detectEntryType,
  createInboxEntry,
  createNoteFromEntry,
  deleteNoteById,
  toggleNoteReadStatus,
  exportNotesAsMarkdown,
} from "../../modules/digitalbrain/digitalBrainStorage";

const NOTES_KEY = "digitalBrain.notes";
const INBOX_KEY = "digitalBrain.inbox";

describe("digitalBrainStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadNotes / saveNotes", () => {
    it("returns empty array when no notes stored", () => {
      expect(loadNotes()).toEqual([]);
    });
    it("returns and migrates notes with isRead", () => {
      const notes = [{ id: "1", title: "A" }, { id: "2", title: "B", isRead: true }];
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      expect(loadNotes()).toHaveLength(2);
      expect(loadNotes()[0].isRead).toBe(false);
      expect(loadNotes()[1].isRead).toBe(true);
    });
    it("saves and loads notes", () => {
      const notes = [{ id: "1", title: "T", isRead: false }];
      saveNotes(notes);
      expect(loadNotes()).toEqual(notes);
    });
  });

  describe("loadInbox / saveInbox", () => {
    it("returns empty array when no inbox", () => {
      expect(loadInbox()).toEqual([]);
    });
    it("saves and loads inbox", () => {
      const items = [{ id: "1", rawContent: "x" }];
      saveInbox(items);
      expect(loadInbox()).toEqual(items);
    });
  });

  describe("extractFirstUrl", () => {
    it("returns null for empty or no url", () => {
      expect(extractFirstUrl("")).toBeNull();
      expect(extractFirstUrl("hello world")).toBeNull();
    });
    it("extracts first http url", () => {
      expect(extractFirstUrl("see https://example.com here")).toBe("https://example.com");
    });
    it("strips trailing punctuation", () => {
      expect(extractFirstUrl("https://example.com).")).toBe("https://example.com");
    });
    it("prefixes www with http", () => {
      expect(extractFirstUrl("www.foo.com")).toBe("http://www.foo.com");
    });
  });

  describe("extractYouTubeId", () => {
    it("returns null when no youtube", () => {
      expect(extractYouTubeId("https://example.com")).toBeNull();
    });
    it("extracts id from watch url", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=abc12345678")).toBe("abc12345678");
    });
    it("extracts id from youtu.be", () => {
      expect(extractYouTubeId("https://youtu.be/abc12345678")).toBe("abc12345678");
    });
  });

  describe("detectEntryType", () => {
    it("returns texto for empty", () => {
      expect(detectEntryType("")).toBe("texto");
      expect(detectEntryType(null)).toBe("texto");
    });
    it("returns video for youtube url", () => {
      expect(detectEntryType("https://www.youtube.com/watch?v=x")).toBe("video");
    });
    it("returns link for plain url", () => {
      expect(detectEntryType("https://example.com")).toBe("link");
    });
    it("returns tarea for todo-like", () => {
      expect(detectEntryType("- [ ] item")).toBe("tarea");
    });
    it("returns nota for plain text", () => {
      expect(detectEntryType("just some text")).toBe("nota");
    });
  });

  describe("createInboxEntry", () => {
    it("creates entry with id, rawContent, type", () => {
      const e = createInboxEntry("hello");
      expect(e.rawContent).toBe("hello");
      expect(e.id).toBeDefined();
      expect(e.type).toBe("nota");
      expect(e.status).toBe("inbox");
    });
  });

  describe("createNoteFromEntry", () => {
    it("creates note with title and content", () => {
      const entry = { id: "e1", rawContent: "raw" };
      const note = createNoteFromEntry(entry, { title: "My Title", structuredContent: "md" });
      expect(note.title).toBe("My Title");
      expect(note.content).toBe("md");
      expect(note.entryId).toBe("e1");
      expect(note.isRead).toBe(false);
    });
  });

  describe("deleteNoteById", () => {
    it("removes note by id", () => {
      const notes = [{ id: "1" }, { id: "2" }];
      saveNotes(notes);
      const updated = deleteNoteById("1");
      expect(updated).toHaveLength(1);
      expect(updated[0].id).toBe("2");
      expect(loadNotes()).toHaveLength(1);
    });
  });

  describe("toggleNoteReadStatus", () => {
    it("toggles isRead for matching note", () => {
      const notes = [{ id: "1", isRead: false }, { id: "2", isRead: true }];
      saveNotes(notes);
      const updated = toggleNoteReadStatus("1");
      expect(updated.find((n) => n.id === "1").isRead).toBe(true);
      expect(updated.find((n) => n.id === "2").isRead).toBe(true);
    });
  });

  describe("exportNotesAsMarkdown", () => {
    it("returns markdown string with titles and content", () => {
      const notes = [{ title: "T1", content: "C1", tags: [] }];
      const md = exportNotesAsMarkdown(notes);
      expect(md).toContain("# T1");
      expect(md).toContain("C1");
    });
  });
});

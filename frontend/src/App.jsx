import { useState, useEffect } from "react";
import TagView from "./TagView";

// Backend URL
const API_BASE = "http://localhost:8000";

// Default tree shown on first load
const makeDefaultTree = () => ({
  id: crypto.randomUUID(),
  name: "root",
  children: [
    {
      id: crypto.randomUUID(),
      name: "child1",
      children: [
        { id: crypto.randomUUID(), name: "child1-child1", data: "c1-c1 Hello" },
        { id: crypto.randomUUID(), name: "child1-child2", data: "c1-c2 JS" },
      ],
    },
    { id: crypto.randomUUID(), name: "child2", data: "c2 World" },
  ],
});

// Remove internal-only fields (id, dbId) before saving/exporting
function stripInternal(node) {
  const result = { name: node.name };
  if (node.data !== undefined) result.data = node.data;
  if (node.children) result.children = node.children.map(stripInternal);
  return result;
}

// Add unique ids to every node (needed after loading from DB)
function addIds(node) {
  return {
    ...node,
    id: crypto.randomUUID(),
    children: node.children ? node.children.map(addIds) : undefined,
  };
}

export default function App() {
  const [trees, setTrees] = useState([
    { ...makeDefaultTree(), dbId: null },
  ]);
  const [exportOutputs, setExportOutputs] = useState({});

  // On page load: fetch saved trees from backend
  useEffect(() => {
    fetch(`${API_BASE}/trees`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          const loaded = data.map((record) => ({
            ...addIds(JSON.parse(record.data)),
            dbId: record.id,
          }));
          setTrees(loaded);
        }
      })
      .catch(() => {
        // Backend not running yet — just show default tree
      });
  }, []);

  // Update one tree in the list
  function updateTree(treeIndex, newTree) {
    setTrees((prev) => {
      const copy = [...prev];
      copy[treeIndex] = { ...newTree, dbId: prev[treeIndex].dbId };
      return copy;
    });
  }

  // Export button: show JSON + save to DB
  async function handleExport(treeIndex) {
    const tree = trees[treeIndex];
    const clean = stripInternal(tree);
    const jsonStr = JSON.stringify(clean, null, 2);

    // Show JSON on screen
    setExportOutputs((prev) => ({ ...prev, [treeIndex]: jsonStr }));

    try {
      if (tree.dbId) {
        // Already saved before → UPDATE (PUT)
        await fetch(`${API_BASE}/trees/${tree.dbId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: jsonStr }),
        });
      } else {
        // First time saving → CREATE (POST)
        const res = await fetch(`${API_BASE}/trees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: jsonStr }),
        });
        const saved = await res.json();
        // Store the DB id so next export uses PUT
        setTrees((prev) => {
          const copy = [...prev];
          copy[treeIndex] = { ...copy[treeIndex], dbId: saved.id };
          return copy;
        });
      }
    } catch {
      alert("Could not save — is the backend running?");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        padding: "32px 24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: 0 }}>
        🌳 Nested Tags Tree
      </h1>
      <p style={{ color: "#64748b", marginTop: 6, marginBottom: 32 }}>
        Build and manage nested tag hierarchies
      </p>

      {/* Render each tree */}
      {trees.map((tree, idx) => (
        <div
          key={idx}
          style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            marginBottom: 40,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Tree header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 15, color: "#475569" }}>
              Tree #{idx + 1}{" "}
              {tree.dbId ? (
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  (saved · ID: {tree.dbId})
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "#f59e0b" }}>
                  (not saved yet)
                </span>
              )}
            </h2>

            <button
              onClick={() => handleExport(idx)}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              📤 Export & Save
            </button>
          </div>

          {/* The recursive tree */}
          <TagView
            node={tree}
            onUpdate={(newNode) => updateTree(idx, newNode)}
          />

          {/* Show exported JSON below the tree */}
          {exportOutputs[idx] && (
            <div style={{ marginTop: 20 }}>
              <h3
                style={{ fontSize: 14, color: "#475569", marginBottom: 8 }}
              >
                📄 Exported JSON:
              </h3>
              <pre
                style={{
                  background: "#1e293b",
                  color: "#e2e8f0",
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 13,
                  overflowX: "auto",
                  maxHeight: 300,
                }}
              >
                {exportOutputs[idx]}
              </pre>
            </div>
          )}
        </div>
      ))}

      {/* Add another tree */}
      <button
        onClick={() =>
          setTrees((prev) => [
            ...prev,
            { ...makeDefaultTree(), dbId: null },
          ])
        }
        style={{
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ➕ Add New Tree
      </button>
    </div>
  );
}
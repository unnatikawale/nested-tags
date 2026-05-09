import { useState } from "react";

export default function TagView({ node, onUpdate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(node.name);

  const hasChildren = Array.isArray(node.children);

  // Update data text field
  function handleDataChange(e) {
    onUpdate({ ...node, data: e.target.value });
  }

  // Add Child button: converts leaf (data) into branch (children)
  function handleAddChild() {
    const newChild = {
      id: crypto.randomUUID(),
      name: "New Child",
      data: "Data",
    };
    const updated = { ...node };
    delete updated.data; // remove data property
    updated.children = hasChildren
      ? [...node.children, newChild]
      : [newChild];
    onUpdate(updated);
  }

  // When a child updates itself, update it in parent's children array
  function handleChildUpdate(index, newChild) {
    const newChildren = [...node.children];
    newChildren[index] = newChild;
    onUpdate({ ...node, children: newChildren });
  }

  // Bonus: Press Enter to confirm new name
  function handleNameKeyDown(e) {
    if (e.key === "Enter") {
      onUpdate({ ...node, name: tempName });
      setEditingName(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        marginBottom: 8,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Blue Header Bar ── */}
      <div
        style={{
          background: "#3b82f6",
          display: "flex",
          alignItems: "center",
          padding: "6px 10px",
          gap: 8,
        }}
      >
        {/* Collapse / Expand button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: "rgba(255,255,255,0.25)",
            border: "none",
            color: "white",
            borderRadius: 4,
            width: 26,
            height: 26,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {collapsed ? ">" : "v"}
        </button>

        {/* Tag Name — click to edit (Bonus feature) */}
        {editingName ? (
          <input
            autoFocus
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={() => {
              onUpdate({ ...node, name: tempName });
              setEditingName(false);
            }}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              border: "2px solid white",
              borderRadius: 4,
              padding: "2px 8px",
              outline: "none",
              background: "rgba(255,255,255,0.95)",
              color: "#1e293b",
            }}
          />
        ) : (
          <span
            onClick={() => {
              setEditingName(true);
              setTempName(node.name);
            }}
            title="Click to rename"
            style={{
              flex: 1,
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {node.name}
          </span>
        )}

        {/* Add Child Button */}
        <button
          onClick={handleAddChild}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.5)",
            color: "white",
            borderRadius: 5,
            padding: "3px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          + Add Child
        </button>
      </div>

      {/* ── Body (hidden when collapsed) ── */}
      {!collapsed && (
        <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
          {hasChildren ? (
            // Recursively render children
            node.children.map((child, i) => (
              <TagView
                key={child.id}
                node={child}
                onUpdate={(updated) => handleChildUpdate(i, updated)}
              />
            ))
          ) : (
            // Leaf node: show data text input
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: 500,
                  minWidth: 42,
                }}
              >
                Data:
              </span>
              <input
                type="text"
                value={node.data ?? ""}
                onChange={handleDataChange}
                style={{
                  flex: 1,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 13,
                  outline: "none",
                  color: "#334155",
                  background: "white",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
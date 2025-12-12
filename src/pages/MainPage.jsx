


// App.jsx
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
// const [message, setMessage] = useState(null);
// const [loading, setLoading] = useState(false);



function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- debugFetch helper ---------- */
async function debugFetch(url, opts = {}) {
  // Get session token from localStorage
  const sessionToken = localStorage.getItem('sessionToken');
  
  // Prepare headers - start with existing headers or empty object
  const headers = {
    ...(opts.headers || {}),
  };
  
  // Set Content-Type to application/json if body exists and Content-Type not already set
  if (opts.body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add session token header if available
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  
  // Prepare fetch options with credentials and headers
  const fetchOpts = {
    ...opts,
    headers,
    credentials: 'include', // Include cookies for session-based auth
  };
  
  console.log("[debugFetch] request:", url, fetchOpts);
  try {
    const res = await fetch(url, fetchOpts);
    const text = await res.text().catch(() => "");
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
    console.log("[debugFetch] response:", { url, status: res.status, ok: res.ok, text, json });
    return {
      ok: res.ok,
      status: res.status,
      json: async () => json,
      text: async () => text,
    };
  } catch (err) {
    console.error("[debugFetch] network error:", err, url);
    throw err;
  }
}

// const handleLogout = async () => {
  
//   setLoading(true);
//   try {
//     const accessToken = localStorage.getItem('accessToken');
//     const sessionToken = localStorage.getItem('sessionToken');
//     const res = await fetch(`${API_BASE}/api/auth/logout`, {
//       method: 'POST',
//       headers: {
//         Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
//         'x-session-token': sessionToken || undefined,
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });
//     if (res.ok) {
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('sessionToken');
//       setAdmin(null);
//       setView('login');
//       setMessage('Logged out');
//     } else {
//       const data = await res.json();
//       setMessage(data?.message || 'Logout failed');
//     }
//   } catch (err) {
//     console.error(err);
//     setMessage('Network error');
//   } finally {
//     setLoading(false);
//   }
// };

/* ---------- Modal for viewing full document JSON ---------- */
function DocumentModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-200">Document Details</h3>
          <button onClick={onClose} className="rounded hover:bg-slate-800 p-1 text-slate-400 hover:text-white transition">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(doc, null, 2)}
          </pre>
        </div>
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-900 text-right">
          <button onClick={onClose} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main App component ---------- */
export default function MainPage() {
  // Health, connection UI
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // DB connection
  const [mongoUri, setMongoUri] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState(null);

  // DB / collections / documents
  const [databases, setDatabases] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);

  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [docsLimit, setDocsLimit] = useState(10);

  // Columns for the collection
  const [columns, setColumns] = useState([]);
  const [columnsLoading, setColumnsLoading] = useState(false);

  // Request form and methods
  const [requestMethod, setRequestMethod] = useState("GET");
  const [apiFormValues, setApiFormValues] = useState({});
  const REQUEST_METHODS = ["GET", "POST", "PUT", "DELETE", "FETCH"];

  // Create API form fields (modal)
  const [apiName, setApiName] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [savingApi, setSavingApi] = useState(false);

  // Stored backend APIs
  const [backendApis, setBackendApis] = useState([]);
  const [backendApisLoading, setBackendApisLoading] = useState(false);
  const [selectedBackendApi, setSelectedBackendApi] = useState(null);
  const [backendApiFormValues, setBackendApiFormValues] = useState({});

  // Relations (mongoose refs)
  const [relations, setRelations] = useState(null);
  const [relationsLoading, setRelationsLoading] = useState(false);

  // UI state: viewing doc modal, create modal, error
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [error, setError] = useState(null);

  // Match-field selection in create modal (single)
  const [modalMatchField, setModalMatchField] = useState("_id");

  // Selected match field for the saved API (used while editing/executing)
  const [selectedMatchField, setSelectedMatchField] = useState("_id");

  // Reset when columns change
  useEffect(() => {
    setModalMatchField("_id");
  }, [columns]);

  // ---------- Network functions (use debugFetch to make debugging visible) ----------

  const connectToCustomDb = async () => {
    if (!mongoUri) {
      setError("Please enter a MongoDB connection URI.");
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      setConnectMessage(null);

      const res = await debugFetch(`${API_BASE_URL}/api/introspect/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: mongoUri }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      setConnectMessage(data.message || "Connected to custom DB.");

      // Reload state from server after connect
      await Promise.all([fetchHealth(), fetchDatabases(), fetchRelations()]);
      setSelectedDb(null);
      setSelectedCollection(null);
      setDocuments([]);
    } catch (err) {
      console.error("[connectToCustomDb] error", err);
      setError(err.message || String(err));
    } finally {
      setConnecting(false);
    }
  };

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      setError(null);
      const res = await debugFetch(`${API_BASE_URL}/api/health`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error("[fetchHealth] error", err);
      setHealth(null);
      setError(err.message || String(err));
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      setDbLoading(true);
      setError(null);
      const res = await debugFetch(`${API_BASE_URL}/api/introspect/databases`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log("[fetchDatabases] received", data);
      setDatabases(data.databases || []);
    } catch (err) {
      console.error("[fetchDatabases] error", err);
      setDatabases([]);
      setError(`Failed to load databases: ${err?.message || String(err)}`);
    } finally {
      setDbLoading(false);
    }
  };

  const fetchCollections = async (dbName) => {
    if (!dbName) return;
    try {
      setCollectionsLoading(true);
      setError(null);
      const res = await debugFetch(`${API_BASE_URL}/api/introspect/collections?dbName=${encodeURIComponent(dbName)}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log("[fetchCollections] for", dbName, data);
      setCollections(data.collections || []);
    } catch (err) {
      console.error("[fetchCollections] error", err);
      setCollections([]);
      setError(err.message || String(err));
    } finally {
      setCollectionsLoading(false);
    }
  };

  const fetchColumns = async (dbName, collectionName) => {
    if (!dbName || !collectionName) return;
    try {
      setColumnsLoading(true);
      setError(null);
      const params = new URLSearchParams({ dbName, collectionName });
      // Note: backend route name used earlier is 'colums' (typo) — if your backend uses /columns change it here.
      const res = await debugFetch(`${API_BASE_URL}/api/introspect/colums?${params.toString()}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log("[fetchColumns] for", dbName, collectionName, data);
      setColumns(data.columns || []);
    } catch (err) {
      console.error("[fetchColumns] error", err);
      setColumns([]);
      setError(err.message || String(err));
    } finally {
      setColumnsLoading(false);
    }
  };

  const fetchDocuments = async (dbName, collectionName, limit = 10) => {
    if (!dbName || !collectionName) return;
    try {
      setDocumentsLoading(true);
      setError(null);
      const params = new URLSearchParams({ dbName, collectionName, limit: String(limit) });
      const res = await debugFetch(`${API_BASE_URL}/api/introspect/documents?${params.toString()}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log("[fetchDocuments] for", dbName, collectionName, data);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("[fetchDocuments] error", err);
      setDocuments([]);
      setError(err.message || String(err));
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      setRelationsLoading(true);
      setError(null);
      const res = await debugFetch(`${API_BASE_URL}/api/relations`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      setRelations(data.data || {});
    } catch (err) {
      console.error("[fetchRelations] error", err);
      setRelations(null);
      setError(err.message || String(err));
    } finally {
      setRelationsLoading(false);
    }
  };

  const fetchBackendApis = async () => {
    try {
      setBackendApisLoading(true);
      setError(null);
      const res = await debugFetch(`${API_BASE_URL}/api/backend-apis`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const list = data.data || [];
      setBackendApis(list);
      if (list.length && !selectedBackendApi) setSelectedBackendApi(list[0]);
    } catch (err) {
      console.error("[fetchBackendApis] error", err);
      setBackendApis([]);
      setError(err.message || String(err));
    } finally {
      setBackendApisLoading(false);
    }
  };

  // ---------- Save / Delete backend API ----------

  // Save API: include meta.matchField when requestMethod === 'PUT' or 'DELETE'
  const saveBackendApi = async () => {
    if (!apiName) { setError("API name is required."); return; }
    if (!selectedDb || !selectedCollection) { setError("Select a database and collection before saving an API."); return; }

    try {
      setSavingApi(true);
      setError(null);

      const body = {
        api_name: apiName,
        password: apiPassword,
        columns,
        request: requestMethod,
        dbName: selectedDb,
        collectionName: selectedCollection,
        payloadSample: apiFormValues,
        meta: {},
      };

      if (requestMethod === "PUT" || requestMethod === "DELETE") {
        body.meta.matchField = modalMatchField || "_id";
      }

      const res = await debugFetch(`${API_BASE_URL}/api/backend-apis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(bodyText || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setShowApiModal(false);
      setApiName("");
      setApiPassword("");
      setModalMatchField("_id");
      await fetchBackendApis();
      if (data?.data) setSelectedBackendApi(data.data);
    } catch (err) {
      console.error("[saveBackendApi] error", err);
      setError(err.message || String(err));
    } finally {
      setSavingApi(false);
    }
  };

  const deleteBackendApi = async (id) => {
    if (!id) return;
    try {
      const res = await debugFetch(`${API_BASE_URL}/api/backend-apis/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(bodyText || `Request failed with status ${res.status}`);
      }
      await fetchBackendApis();
      if (selectedBackendApi?._id === id) {
        setSelectedBackendApi(null);
        setBackendApiFormValues({});
      }
    } catch (err) {
      console.error("[deleteBackendApi] error", err);
      setError(err.message || String(err));
    }
  };

  // ---------- Effects & sync ----------

  // initial bootstrap
  useEffect(() => {
    console.log("[App mount] API_BASE_URL =", API_BASE_URL);
    fetchHealth();
    fetchDatabases();
    fetchRelations();
    fetchBackendApis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when user selects a DB, fetch its collections
  useEffect(() => {
    if (selectedDb) {
      setSelectedCollection(null);
      setDocuments([]);
      fetchCollections(selectedDb);
    } else {
      setCollections([]);
    }
  }, [selectedDb]);

  // when user selects a collection, fetch docs + columns
  useEffect(() => {
    if (selectedDb && selectedCollection) {
      fetchDocuments(selectedDb, selectedCollection, docsLimit);
      fetchColumns(selectedDb, selectedCollection);
    } else {
      setDocuments([]);
      setColumns([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollection, docsLimit]);

  // keep create modal form in sync with available columns
  useEffect(() => {
    setApiFormValues((prev) => {
      const next = {};
      columns.forEach((col) => {
        next[col] = prev?.[col] ?? "";
      });
      return next;
    });
  }, [columns]);

  // when selectedBackendApi changes, prefill form and load matchField
  useEffect(() => {
    if (selectedBackendApi) {
      const cols = selectedBackendApi.columns || [];
      const payload = selectedBackendApi.payloadSample || {};
      const next = {};
      cols.forEach((c) => { next[c] = payload?.[c] ?? ""; });
      setBackendApiFormValues(next);

      const match = (selectedBackendApi.meta && selectedBackendApi.meta.matchField) ? selectedBackendApi.meta.matchField : "_id";
      setSelectedMatchField(match);
      setBackendApiFormValues((prev) => ({ ...prev, [match]: prev?.[match] ?? "" }));
    } else {
      setBackendApiFormValues({});
      setSelectedMatchField("_id");
    }
  }, [selectedBackendApi]);

  // ---------- Helpers ----------

  const handleFieldChange = (column, value) => setApiFormValues((prev) => ({ ...prev, [column]: value }));
  const handleBackendApiFieldChange = (column, value) => setBackendApiFormValues((prev) => ({ ...prev, [column]: value }));

  const loadBackendApiData = () => {
    if (!selectedBackendApi?.dbName || !selectedBackendApi?.collectionName) {
      setError("Saved API is missing database or collection info.");
      return;
    }
    setSelectedDb(selectedBackendApi.dbName);
    setSelectedCollection(selectedBackendApi.collectionName);
    fetchDocuments(selectedBackendApi.dbName, selectedBackendApi.collectionName, docsLimit);
    fetchColumns(selectedBackendApi.dbName, selectedBackendApi.collectionName);
  };

  // execute backend API — supports PUT, DELETE and POST (inserts)
  const executeBackendApi = async () => {
    if (!selectedBackendApi) {
      setError("Select a saved API to execute.");
      return;
    }

    try {
      setError(null);
      const savedRequest = (selectedBackendApi.request || "GET").toUpperCase();

      if (savedRequest === "PUT") {
        // match field (single)
        const matchField = (selectedBackendApi.meta && selectedBackendApi.meta.matchField) ? selectedBackendApi.meta.matchField : "_id";
        const matchValue = backendApiFormValues[matchField] ?? backendApiFormValues["id"] ?? backendApiFormValues["_id"];

        if (matchValue === undefined || matchValue === "") {
          setError(`PUT requires value for match field "${matchField}". Enter the target document's ${matchField} in the form.`);
          return;
        }

        // Build payload: include the match field and all non-system columns (the same columns used by POST),
        // excluding the match field itself (we don't want to overwrite the criteria)
        const BODY_FIELD_EXCLUDE = new Set(["_id", "id", "__v", "createdAt", "updatedAt", "created_at", "updated_at"]);

        const updatePayload = {};
        // include matchField so backend can find the doc
        updatePayload[matchField] = matchValue;

        // iterate api.columns and add their values (if present) except excluded and matchField
        const allCols = selectedBackendApi.columns || [];
        allCols.forEach((col) => {
          if (BODY_FIELD_EXCLUDE.has(col)) return;
          if (col === matchField) return;
          // send the form value (even if empty string); backend will set updatedAt
          updatePayload[col] = backendApiFormValues[col] ?? "";
        });

        const res = await debugFetch(`${API_BASE_URL}/api/backend-apis/${selectedBackendApi._id}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: updatePayload }),
        });
        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          throw new Error(bodyText || `Request failed with status ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data.data)) setDocuments(data.data);
        else if (data.data) setDocuments([data.data]);
        loadBackendApiData();
        return;
      }

      if (savedRequest === "DELETE") {
        // match field (single)
        const matchField = (selectedBackendApi.meta && selectedBackendApi.meta.matchField) ? selectedBackendApi.meta.matchField : "_id";
        const matchValue = backendApiFormValues[matchField] ?? backendApiFormValues["id"] ?? backendApiFormValues["_id"];

        if (matchValue === undefined || matchValue === "") {
          setError(`DELETE requires value for match field "${matchField}". Enter the target document's ${matchField} in the form.`);
          return;
        }

        // Build payload: include only match field (no other fields)
        const deletePayload = { [matchField]: matchValue };

        const res = await debugFetch(`${API_BASE_URL}/api/backend-apis/${selectedBackendApi._id}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: deletePayload }),
        });
        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          throw new Error(bodyText || `Request failed with status ${res.status}`);
        }
        const data = await res.json();
        // Refresh data and show deleted docs (backend returns deleted docs)
        await loadBackendApiData();
        setDocuments(Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []));
        return;
      }

      // default: POST (insert)
      const res = await debugFetch(`${API_BASE_URL}/api/backend-apis/${selectedBackendApi._id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: backendApiFormValues, limit: docsLimit }),
      });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(bodyText || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.data)) setDocuments(data.data);
      else if (data.data) setDocuments([data.data]);
      loadBackendApiData();
    } catch (err) {
      console.error("[executeBackendApi] error", err);
      setError(err.message || String(err));
    }
  };

  // ---- rendering helpers for documents table ----
  const flattenObject = (obj, prefix = "", res = {}) => {
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        flattenObject(value, newKey, res);
      } else res[newKey] = value;
    }
    return res;
  };

  const isArrayOfObjects = (arr) => Array.isArray(arr) && arr.length > 0 && arr.every((i) => typeof i === "object" && i !== null);

  const getTableColumns = (docs) => {
    const cols = new Set(); cols.add("_id");
    docs.forEach((doc) => { if (doc && typeof doc === "object") Object.keys(doc).forEach((k) => cols.add(k)); });
    return Array.from(cols);
  };

  const formatCell = (value) => {
    if (value === null || value === undefined) return <span className="text-slate-600 italic">null</span>;
    if (typeof value === "boolean") return value ? <span className="text-emerald-400">true</span> : <span className="text-red-400">false</span>;
    if (typeof value === "number") return <span className="text-sky-300">{value}</span>;
    if (value instanceof Date) return value.toISOString();
    try { if (typeof value === "object") return JSON.stringify(value); return String(value); } catch { return String(value); }
  };

  const renderDocumentsTable = (originalDocs) => {
    if (!isArrayOfObjects(originalDocs)) {
      return <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap">{JSON.stringify(originalDocs, null, 2)}</pre>;
    }
    const docs = originalDocs.map((doc) => flattenObject(doc));
    const cols = getTableColumns(docs);

    return (
      <div className="flex flex-col h-full">
        <div className="overflow-auto border border-slate-800 rounded-lg bg-slate-900/50 shadow-inner max-h-[500px]">
          <table className="min-w-max border-collapse">
            <thead className="bg-slate-950 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-950 px-3 py-3 text-left text-xs font-semibold text-slate-400 border-r border-b border-slate-800 w-[50px]">#</th>
                {cols.map((col) => (
                  <th key={col} className={classNames("px-4 py-3 text-left text-xs font-medium text-slate-300 border-r border-b border-slate-800 whitespace-nowrap", col === "_id" ? "sticky left-[50px] z-30 bg-slate-950" : "")}>
                    <span className="font-mono text-[11px] block max-w-[200px] truncate" title={col}>{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-950/20">
              {docs.map((doc, idx) => (
                <tr key={idx} className="group hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => setViewingDoc(originalDocs[idx])}>
                  <td className="sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900 border-r border-slate-800 px-3 py-2 text-center text-xs text-slate-500">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400">👁</span>
                  </td>
                  {cols.map((col) => (
                    <td key={col} className={classNames("px-4 py-2.5 text-[12px] text-slate-300 border-r border-slate-800/50 whitespace-nowrap overflow-hidden max-w-[250px]", col === "_id" ? "sticky left-[50px] z-10 bg-slate-950 group-hover:bg-slate-900 font-mono text-sky-200/80" : "")}>
                      <div className="truncate" title={typeof doc[col] === 'string' ? doc[col] : ''}>{formatCell(doc[col])}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 text-right">* Click any row to view full JSON details</div>
      </div>
    );
  };

  // Which fields to show in the saved API edit form
  const BODY_FIELD_EXCLUDE = new Set(["_id", "id", "__v", "createdAt", "updatedAt", "created_at", "updated_at"]);
  const getEditableColumnsForSelectedApi = () => {
    if (!selectedBackendApi) return [];
    const matchField = selectedBackendApi.meta?.matchField || "_id";
    return (selectedBackendApi.columns || []).filter((c) => !BODY_FIELD_EXCLUDE.has(c) && c !== matchField);
  };

  // ---------- UI ----------

  const healthStatusColor = health?.status === "healthy" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40" : "bg-red-500/10 text-red-300 border-red-500/40";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-sky-500/30">
      {/* Modals */}
      {viewingDoc && <DocumentModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}

      {/* Create API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-200">Create API</h3>
              <button onClick={() => setShowApiModal(false)} className="rounded hover:bg-slate-800 p-1 text-slate-400 hover:text-white transition">✕</button>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-auto">
              {/* Left: match field (single) + columns list */}
              <div className="col-span-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Name</label>
                  <input type="text" placeholder="API name" value={apiName} onChange={(e) => setApiName(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500" />
                </div>

                {/* Match field selector (single choice) */}
                {(requestMethod === "PUT" || requestMethod === "DELETE") && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Match field (single)</label>
                    <select value={modalMatchField} onChange={(e) => setModalMatchField(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500">
                      <option value="_id">_id</option>
                      {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">PUT/DELETE will match documents using this single column. The fields below will be the ones updated (PUT) or the criteria (DELETE).</p>
                  </div>
                )}

                <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900/50 p-3 max-h-[60vh]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">Columns</span>
                    {columnsLoading && <span className="text-[10px] text-sky-400">Loading…</span>}
                  </div>

                  {columns.length === 0 && !columnsLoading ? (
                    <p className="text-[11px] text-slate-500">{selectedDb && selectedCollection ? "No columns detected in this collection." : "Select a database and collection first."}</p>
                  ) : (
                    <ul className="space-y-1 text-[12px] text-slate-200">
                      {columns.map((col) => (
                        <li key={col} className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                            <span className="font-mono truncate">{col}</span>
                          </div>
                          {["_id","id","createdAt","updatedAt","__v"].includes(col) && <span className="text-[10px] text-slate-500">sys</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right: request body */}
              <div className="col-span-9 flex flex-col gap-4 overflow-hidden">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200">Request</span>
                      <select value={requestMethod} onChange={(e) => setRequestMethod(e.target.value)} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500">
                        {REQUEST_METHODS.map((method) => (<option key={method} value={method}>{method}</option>))}
                      </select>
                    </div>
                    <div className="text-[11px] text-slate-500">{selectedDb && selectedCollection ? `${selectedDb} / ${selectedCollection}` : "Select DB & Collection"}</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[12px] text-slate-200 space-y-3 max-h-[220px] overflow-auto">
                    {columns.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No fields available. Select a collection.</p>
                    ) : (
                      // show non-system columns for payload sample
                      (columns.filter((c) => !new Set(["_id", "id", "__v", "createdAt", "updatedAt", "created_at", "updated_at"]).has(c))).map((col) => (
                        <div key={col} className="flex flex-col gap-1">
                          <label className="text-[11px] text-slate-400 font-medium">{col}</label>
                          <input type="text" value={apiFormValues[col] ?? ""} onChange={(e) => handleFieldChange(col, e.target.value)} placeholder={`Enter ${col}`} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 px-4 py-3 bg-slate-900 flex justify-end">
              <button onClick={saveBackendApi} disabled={savingApi} className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {savingApi ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* top background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.12),_transparent_45%)]" />

      <div className="relative z-10">
        {/* Header */} 
        <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center w-full max-w-xl">
              <div className="flex-1">
                <label className="text-[11px] text-slate-400 block mb-1">MongoDB connection URI</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="mongodb+srv://..." value={mongoUri} onChange={(e) => setMongoUri(e.target.value)} className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors" />
                  <button onClick={connectToCustomDb} disabled={connecting || !mongoUri} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition-colors">
                    {connecting ? "Connecting…" : "Connect"}
                  </button>
                </div>
                {connectMessage && <span className="text-[10px] text-emerald-400/80 mt-1 block">{connectMessage}</span>}
              </div>
            </div>

            <div className="text-right hidden md:block">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-200 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                Mongo Introspect
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100">Dashboard</h1>
            </div>

            <div className="flex flex-col items-end gap-2">
            {/* <div className="flex gap-3">
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm">Logout</button>
                </div> */}
              <button onClick={() => { fetchHealth(); fetchDatabases(); fetchRelations(); if (selectedDb) fetchCollections(selectedDb); if (selectedDb && selectedCollection) fetchDocuments(selectedDb, selectedCollection, docsLimit); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition">
                <span className="text-sm">⟳</span> Refresh
              </button>

              <button onClick={() => { if (!selectedDb || !selectedCollection) { setError("Select a database and collection before creating an API."); return; } fetchColumns(selectedDb, selectedCollection); if (documents.length === 0) fetchDocuments(selectedDb, selectedCollection, docsLimit); setShowApiModal(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/60 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-500/20 transition">
                Create API
              </button>

              <div className={classNames("flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] shadow-sm", health ? healthStatusColor : "border-slate-700 text-slate-400 bg-slate-900/80")}>
                {healthLoading ? <span className="italic">Checking...</span> : health ? (<><span className={classNames("inline-block h-2 w-2 rounded-full", health.status === "healthy" ? "bg-emerald-400" : "bg-red-400")} /><span className="font-semibold">{health.status === "healthy" ? "Healthy" : "Down"}</span></>) : <span>Unavailable</span>}
              </div>
            </div>
          </div>
        </header>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SIDEBAR (Databases & Collections) */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Databases */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm flex flex-col h-[300px]">
                <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                  <h2 className="text-sm font-semibold text-slate-200">Databases</h2>
                  {dbLoading && <span className="text-[10px] text-sky-400 animate-pulse">Loading…</span>}
                </div>
                <div className="p-2 overflow-auto flex-1 custom-scrollbar">
                  {databases.length === 0 && !dbLoading && <p className="text-xs text-slate-500 px-2 py-2">No databases found.</p>}
                  <div className="space-y-1">
                    {databases.map((db) => (
                      <button key={db.name} onClick={() => setSelectedDb(db.name)} className={classNames("w-full text-left rounded-lg px-3 py-2 text-xs border transition flex items-center justify-between group", selectedDb === db.name ? "border-sky-500/50 bg-sky-500/10 text-sky-100 shadow-[0_0_10px_-3px_rgba(14,165,233,0.3)]" : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200")}>
                        <span className="font-medium truncate">{db.name}</span>
                        <span className="text-[10px] opacity-50 group-hover:opacity-100">{Math.round((db.sizeOnDisk || 0) / 1024)} KB</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collections */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm flex flex-col h-[300px]">
                <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                  <h2 className="text-sm font-semibold text-slate-200">Collections</h2>
                  {collectionsLoading && <span className="text-[10px] text-sky-400 animate-pulse">Loading…</span>}
                </div>
                <div className="p-2 overflow-auto flex-1 custom-scrollbar">
                  {!selectedDb ? (
                    <div className="h-full flex items-center justify-center text-center px-4">
                      <p className="text-xs text-slate-600">Select a database to view collections.</p>
                    </div>
                  ) : collections.length === 0 && !collectionsLoading ? (
                    <p className="text-xs text-slate-500 px-2 py-2">No collections found.</p>
                  ) : (
                    <div className="space-y-1">
                      {collections.map((col) => (
                        <button key={col} onClick={() => setSelectedCollection(col)} className={classNames("w-full text-left rounded-lg px-3 py-2 text-xs border transition flex items-center", selectedCollection === col ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]" : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200")}>
                          <span className="font-medium truncate">{col}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <section className="lg:col-span-9 space-y-6">
              {/* Documents Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm flex flex-col">
                <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 rounded-t-2xl">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">Documents Preview</h2>
                    <p className="text-[11px] text-slate-500">{selectedDb && selectedCollection ? `${selectedDb} > ${selectedCollection}` : 'Select a collection'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg border border-slate-800 px-2 py-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Limit</span>
                      <input type="number" min={1} max={1000} value={docsLimit} onChange={(e) => setDocsLimit(Number(e.target.value) > 0 ? Number(e.target.value) : 1)} className="w-12 bg-transparent text-xs text-slate-200 outline-none text-right font-mono" />
                    </div>
                    <button onClick={() => selectedDb && selectedCollection && fetchDocuments(selectedDb, selectedCollection, docsLimit)} disabled={!selectedDb || !selectedCollection} className="text-[11px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">Reload Data</button>
                  </div>
                </div>

                <div className="p-4">
                  {documentsLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
                      <p className="text-xs text-slate-500">Fetching documents...</p>
                    </div>
                  ) : !selectedDb || !selectedCollection ? (
                    <div className="flex items-center justify-center h-48 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                      <p className="text-xs text-slate-500">Select a database & collection to start.</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="flex items-center justify-center h-24">
                      <p className="text-xs text-slate-500">Collection is empty.</p>
                    </div>
                  ) : (
                    renderDocumentsTable(documents)
                  )}
                </div>
              </div>

              {/* Relations & Saved APIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Relations */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm flex flex-col h-[200px]">
                  <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                    <h2 className="text-sm font-semibold text-slate-200">Mongoose Relations</h2>
                    <button onClick={fetchRelations} className="text-[10px] text-slate-400 hover:text-white transition">Refresh</button>
                  </div>
                  <div className="p-3 overflow-auto flex-1 custom-scrollbar">
                    {relationsLoading ? <p className="text-xs text-slate-400 italic p-2">Loading relations…</p> : !relations || Object.keys(relations).length === 0 ? <div className="h-full flex items-center justify-center text-center"><p className="text-xs text-slate-600">No schema relations detected.</p></div> : (<table className="w-full text-left text-xs"><tbody className="divide-y divide-slate-800/50">{Object.entries(relations).map(([modelName, refs]) => (<tr key={modelName}><td className="py-2 pr-3 align-top font-medium text-sky-200/80">{modelName}</td><td className="py-2">{Array.isArray(refs) && refs.length > 0 ? (<div className="flex flex-wrap gap-1.5">{refs.map((ref, idx) => (<span key={idx} className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700">→ {ref}</span>))}</div>) : (<span className="text-[10px] text-slate-600">-</span>)}</td></tr>))}</tbody></table>)}
                  </div>
                </div>

                {/* Saved Backend APIs */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 shadow-sm flex flex-col lg:col-span-2">
                  <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 rounded-t-2xl">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-200">Saved APIs</h2>
                      <p className="text-[11px] text-slate-500">Request method locked to saved value.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={fetchBackendApis} className="text-[11px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium hover:bg-slate-800 transition">Refresh</button>
                      <button onClick={() => setShowApiModal(true)} className="text-[11px] rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-100 hover:bg-emerald-500/20 transition">+ New API</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 p-4 min-h-[420px]">
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-2 max-h-[420px] overflow-auto">
                      {backendApisLoading ? <p className="text-[11px] text-slate-500 italic">Loading saved APIs…</p> : backendApis.length === 0 ? <p className="text-[11px] text-slate-500">No saved APIs. Create one to begin.</p> : backendApis.map((api) => (<div key={api._id} className={classNames("rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition", selectedBackendApi?._id === api._id ? "border-sky-500/60 bg-sky-500/10 text-sky-100" : "border-slate-800 bg-slate-900 hover:border-slate-600")} onClick={() => setSelectedBackendApi(api)}><div className="flex flex-col truncate"><span className="font-semibold truncate">{api.api_name}</span><span className="text-[10px] text-slate-400">{api.request}</span></div><button onClick={(e) => { e.stopPropagation(); deleteBackendApi(api._id); }} className="text-[10px] text-red-300 hover:text-red-200">Delete</button></div>))}
                    </div>

                    <div className="col-span-12 md:col-span-8 lg:col-span-9 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-4 min-h-[420px]">
                      {!selectedBackendApi ? <p className="text-[12px] text-slate-400">Select a saved API to view details.</p> : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200">Request: {selectedBackendApi.request}</span>
                              <span className="text-[11px] text-slate-500">{selectedBackendApi.dbName || "N/A"} / {selectedBackendApi.collectionName || "N/A"}</span>
                              {(selectedBackendApi.request || "").toUpperCase() === "PUT" && (
                                <span className="text-[11px] text-slate-400 ml-2">Match field: <strong className="font-mono text-[11px]">{selectedBackendApi.meta?.matchField || "_id"}</strong></span>
                              )}
                              {(selectedBackendApi.request || "").toUpperCase() === "DELETE" && (
                                <span className="text-[11px] text-slate-400 ml-2">Match field: <strong className="font-mono text-[11px]">{selectedBackendApi.meta?.matchField || "_id"}</strong></span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={loadBackendApiData} className="text-[11px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium hover:bg-slate-700 transition">Load Data</button>
                              <button onClick={executeBackendApi} className="text-[11px] rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-100 hover:bg-emerald-500/20 transition">Execute</button>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 max-h-[320px] overflow-auto">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-200">Editable Fields</span>
                              <span className="text-[10px] text-slate-500">Enter values to update / criteria for delete</span>
                            </div>

                            {/* NEW: if the saved API is DELETE, only show the match-field input (no other editable fields) */}
                            {(selectedBackendApi.request || "").toUpperCase() === "DELETE" ? (
                              <div className="mt-3">
                                <label className="text-[11px] text-slate-400 font-medium">{selectedBackendApi.meta?.matchField || "_id"} (delete criteria)</label>
                                <input
                                  type="text"
                                  value={backendApiFormValues[selectedBackendApi.meta?.matchField || "_id"] ?? ""}
                                  onChange={(e) => handleBackendApiFieldChange(selectedBackendApi.meta?.matchField || "_id", e.target.value)}
                                  placeholder={`Enter ${selectedBackendApi.meta?.matchField || "_id"} value`}
                                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">This value will be used to find and delete the document(s) matching the chosen field.</p>
                              </div>
                            ) : (
                              <>
                                {getEditableColumnsForSelectedApi().length === 0 ? <p className="text-[11px] text-slate-500">No editable fields defined for this API.</p> : getEditableColumnsForSelectedApi().map((col) => (
                                  <div key={col} className="flex flex-col gap-1 mb-2">
                                    <label className="text-[11px] text-slate-400 font-medium">{col}</label>
                                    <input type="text" value={backendApiFormValues[col] ?? ""} onChange={(e) => handleBackendApiFieldChange(col, e.target.value)} placeholder={`Enter ${col}`} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500" />
                                  </div>
                                ))}

                                {(selectedBackendApi.request || "").toUpperCase() === "PUT" && (
                                  <div className="mt-3">
                                    <label className="text-[11px] text-slate-400 font-medium">{selectedBackendApi.meta?.matchField || "_id"} (target criteria)</label>
                                    <input type="text" value={backendApiFormValues[selectedBackendApi.meta?.matchField || "_id"] ?? ""} onChange={(e) => handleBackendApiFieldChange(selectedBackendApi.meta?.matchField || "_id", e.target.value)} placeholder={`Enter ${selectedBackendApi.meta?.matchField || "_id"} value`} className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500" />
                                    <p className="text-[10px] text-slate-500 mt-1">This value will be used to find the document(s) to update (the "match field").</p>
                                  </div>
                                )}
                              </>
                            )}

                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

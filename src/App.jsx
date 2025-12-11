// import { useEffect, useState } from "react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// function classNames(...classes) {
//   return classes.filter(Boolean).join(" ");
// }

// function App() {
//   const [health, setHealth] = useState(null);
//   const [healthLoading, setHealthLoading] = useState(false);


//   const [mongoUri, setMongoUri] = useState("");
//   const [connecting, setConnecting] = useState(false);
//   const [connectMessage, setConnectMessage] = useState(null);



//   const [databases, setDatabases] = useState([]);
//   const [dbLoading, setDbLoading] = useState(false);
//   const [selectedDb, setSelectedDb] = useState(null);

//   const [collections, setCollections] = useState([]);
//   const [collectionsLoading, setCollectionsLoading] = useState(false);
//   const [selectedCollection, setSelectedCollection] = useState(null);

//   const [documents, setDocuments] = useState([]);
//   const [documentsLoading, setDocumentsLoading] = useState(false);
//   const [docsLimit, setDocsLimit] = useState(10);

//   const [relations, setRelations] = useState(null);
//   const [relationsLoading, setRelationsLoading] = useState(false);

//   const [error, setError] = useState(null);


//   const connectToCustomDb = async () => {
//   if (!mongoUri) {
//     setError("Please enter a MongoDB connection URI.");
//     return;
//   }

//   try {
//     setConnecting(true);
//     setError(null);
//     setConnectMessage(null);

//     const res = await fetch(`${API_BASE_URL}/api/introspect/connect`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ uri: mongoUri }),
//     });

//     if (!res.ok) await handleFetchError(res);
//     const data = await res.json();

//     setConnectMessage(data.message || "Connected to custom DB.");

//     // After successful connect, reload everything using the new DB
//     await Promise.all([fetchHealth(), fetchDatabases(), fetchRelations()]);
//     setSelectedDb(null);
//     setSelectedCollection(null);
//     setDocuments([]);
//   } catch (err) {
//     console.error(err);
//     setError(err.message);
//   } finally {
//     setConnecting(false);
//   }
// };



//   // Shared error handler
//   const handleFetchError = async (res) => {
//     let body;
//     try {
//       body = await res.json();
//     } catch {
//       body = {};
//     }
//     throw new Error(body.message || body.error || `Request failed with status ${res.status}`);
//   };

//   // Fetch functions
//   const fetchHealth = async () => {
//     try {
//       setHealthLoading(true);
//       setError(null);
//       const res = await fetch(`${API_BASE_URL}/api/health`);
//       if (!res.ok) await handleFetchError(res);
//       const data = await res.json();
//       setHealth(data);
//     } catch (err) {
//       console.error(err);
//       setHealth(null);
//       setError(err.message);
//     } finally {
//       setHealthLoading(false);
//     }
//   };

//   const fetchDatabases = async () => {
//     try {
//       setDbLoading(true);
//       setError(null);
//       const res = await fetch(`${API_BASE_URL}/api/introspect/databases`);
//       if (!res.ok) await handleFetchError(res);
//       const data = await res.json();
//       setDatabases(data.databases || []);
//     } catch (err) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setDbLoading(false);
//     }
//   };

//   const fetchCollections = async (dbName) => {
//     if (!dbName) return;
//     try {
//       setCollectionsLoading(true);
//       setError(null);
//       const res = await fetch(
//         `${API_BASE_URL}/api/introspect/collections?dbName=${encodeURIComponent(dbName)}`
//       );
//       if (!res.ok) await handleFetchError(res);
//       const data = await res.json();
//       setCollections(data.collections || []);
//     } catch (err) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setCollectionsLoading(false);
//     }
//   };

//   const fetchDocuments = async (dbName, collectionName, limit = 10) => {
//     if (!dbName || !collectionName) return;
//     try {
//       setDocumentsLoading(true);
//       setError(null);
//       const params = new URLSearchParams({
//         dbName,
//         collectionName,
//         limit: String(limit),
//       });
//       const res = await fetch(
//         `${API_BASE_URL}/api/introspect/documents?${params.toString()}`
//       );
//       if (!res.ok) await handleFetchError(res);
//       const data = await res.json();
//       setDocuments(data.documents || []);
//     } catch (err) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setDocumentsLoading(false);
//     }
//   };

//   const fetchRelations = async () => {
//     try {
//       setRelationsLoading(true);
//       setError(null);
//       const res = await fetch(`${API_BASE_URL}/api/relations`);
//       if (!res.ok) await handleFetchError(res);
//       const data = await res.json();
//       setRelations(data.data || {});
//     } catch (err) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setRelationsLoading(false);
//     }
//   };

//   // Initial load
//   useEffect(() => {
//     fetchHealth();
//     fetchDatabases();
//     fetchRelations();
//   }, []);

//   // When DB changes, load its collections
//   useEffect(() => {
//     if (selectedDb) {
//       setSelectedCollection(null);
//       setDocuments([]);
//       fetchCollections(selectedDb);
//     } else {
//       setCollections([]);
//     }
//   }, [selectedDb]);

//   // When collection or limit changes, reload docs
//   useEffect(() => {
//     if (selectedDb && selectedCollection) {
//       fetchDocuments(selectedDb, selectedCollection, docsLimit);
//     } else {
//       setDocuments([]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedCollection, docsLimit]);

//   const healthStatusColor =
//     health?.status === "healthy"
//       ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
//       : "bg-red-500/10 text-red-300 border-red-500/40";

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-50">
//       {/* Background gradient */}
//       <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.12),_transparent_45%)]" />

//       <div className="relative z-10">
//         {/* Top bar */}
//         <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">


//           <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">




          
//         {/* DB connection bar */}
// <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
//   <div className="flex-1">
//     <label className="text-[11px] text-slate-400 block mb-1">
//       MongoDB connection URI
//     </label>
//     <input
//       type="text"
//       placeholder="mongodb+srv://user:pass@cluster/mydb?retryWrites=true&w=majority"
//       value={mongoUri}
//       onChange={(e) => setMongoUri(e.target.value)}
//       className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
//     />
//   </div>
//   <div className="flex flex-col items-end gap-1">
//     <button
//       onClick={connectToCustomDb}
//       disabled={connecting || !mongoUri}
//       className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
//     >
//       {connecting ? "Connecting…" : "Connect DB"}
//     </button>
//     {connectMessage && (
//       <span className="text-[11px] text-emerald-300">{connectMessage}</span>
//     )}
//   </div>
// </div>




//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-200 mb-2">
//                 <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
//                 Mongo Introspect
//               </div>
//               <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
//                 MongoDB Introspect Dashboard
//               </h1>
//               <p className="text-xs sm:text-sm text-slate-400 mt-1">
//                 Inspect databases, collections, sample documents & Mongoose relations.
//               </p>
//             </div>

//             <div className="flex flex-col items-end gap-2">
//               <button
//                 onClick={() => {
//                   fetchHealth();
//                   fetchDatabases();
//                   fetchRelations();
//                   if (selectedDb) fetchCollections(selectedDb);
//                   if (selectedDb && selectedCollection)
//                     fetchDocuments(selectedDb, selectedCollection, docsLimit);
//                 }}
//                 className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition"
//               >
//                 <span className="text-sm">⟳</span>
//                 Refresh all
//               </button>

//               <div
//                 className={classNames(
//                   "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] shadow-sm",
//                   health ? healthStatusColor : "border-slate-700 text-slate-400 bg-slate-900/80"
//                 )}
//               >
//                 {healthLoading ? (
//                   <span className="italic">Checking connection…</span>
//                 ) : health ? (
//                   <>
//                     <span
//                       className={classNames(
//                         "inline-block h-2 w-2 rounded-full",
//                         health.status === "healthy" ? "bg-emerald-400" : "bg-red-400"
//                       )}
//                     />
//                     <span className="font-semibold">
//                       {health.status === "healthy" ? "Healthy" : "Unhealthy"}
//                     </span>
//                     <span className="text-slate-400 hidden sm:inline">
//                       ({health.connectionState})
//                     </span>
//                   </>
//                 ) : (
//                   <span>Health unavailable</span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Main content */}
//         <main className="py-6">
//           <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-5">
//             {/* Sidebar column */}
//             <aside className="lg:col-span-1 space-y-4">
//               {/* Databases card */}
//               <div className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-sm">
//                 <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
//                   <div>
//                     <h2 className="text-sm font-semibold">Databases</h2>
//                     <p className="text-[11px] text-slate-500">Select a DB to inspect.</p>
//                   </div>
//                   {dbLoading && (
//                     <span className="text-[10px] text-slate-500">Loading…</span>
//                   )}
//                 </div>
//                 <div className="p-3 max-h-72 overflow-auto space-y-1.5 pr-1">
//                   {databases.length === 0 && !dbLoading && (
//                     <p className="text-xs text-slate-500 px-1 py-2">
//                       No databases found or failed to load.
//                     </p>
//                   )}
//                   {databases.map((db) => (
//                     <button
//                       key={db.name}
//                       onClick={() => setSelectedDb(db.name)}
//                       className={classNames(
//                         "w-full text-left rounded-xl px-3 py-2 text-xs border transition flex flex-col gap-0.5",
//                         selectedDb === db.name
//                           ? "border-sky-500/70 bg-sky-500/10 text-sky-100"
//                           : "border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800/90"
//                       )}
//                     >
//                       <div className="flex items-center justify-between">
//                         <span className="font-medium">{db.name}</span>
//                         {db.empty && (
//                           <span className="text-[10px] rounded-full border border-slate-500/40 px-2 py-0.5 text-slate-300">
//                             Empty
//                           </span>
//                         )}
//                       </div>
//                       <p className="text-[10px] text-slate-400">
//                         Size on disk: {Math.round((db.sizeOnDisk || 0) / 1024)} KB
//                       </p>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Collections card */}
//               <div className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-sm">
//                 <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
//                   <div>
//                     <h2 className="text-sm font-semibold">Collections</h2>
//                     <p className="text-[11px] text-slate-500">
//                       From the selected database.
//                     </p>
//                   </div>
//                   {collectionsLoading && (
//                     <span className="text-[10px] text-slate-500">Loading…</span>
//                   )}
//                 </div>
//                 <div className="p-3 max-h-72 overflow-auto space-y-1.5 pr-1">
//                   {!selectedDb ? (
//                     <p className="text-xs text-slate-500 px-1 py-2">
//                       Choose a database above to view its collections.
//                     </p>
//                   ) : collections.length === 0 && !collectionsLoading ? (
//                     <p className="text-xs text-slate-500 px-1 py-2">
//                       No collections found in <span className="font-medium">{selectedDb}</span>.
//                     </p>
//                   ) : (
//                     collections.map((col) => (
//                       <button
//                         key={col}
//                         onClick={() => setSelectedCollection(col)}
//                         className={classNames(
//                           "w-full text-left rounded-xl px-3 py-2 text-xs border transition",
//                           selectedCollection === col
//                             ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100"
//                             : "border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800/90"
//                         )}
//                       >
//                         <span className="font-medium">{col}</span>
//                       </button>
//                     ))
//                   )}
//                 </div>
//               </div>
//             </aside>

//             {/* Main column */}
//             <section className="lg:col-span-3 space-y-4">
//               {/* Error banner */}
//               {error && (
//                 <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100 flex items-start justify-between gap-2">
//                   <div>
//                     <p className="font-semibold text-[11px]">Something went wrong</p>
//                     <p className="mt-1 text-[11px]">{error}</p>
//                   </div>
//                   <button
//                     onClick={() => setError(null)}
//                     className="text-[11px] underline underline-offset-2"
//                   >
//                     Dismiss
//                   </button>
//                 </div>
//               )}

//               {/* Documents viewer */}
//               <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-sm">
//                 <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
//                   <div>
//                     <h2 className="text-sm font-semibold">Documents preview</h2>
//                     <p className="text-[11px] text-slate-500">
//                       Shows a limited set of documents from the selected collection.
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <label className="flex items-center gap-1 text-[11px] text-slate-400">
//                       Limit
//                       <input
//                         type="number"
//                         min={1}
//                         max={1000}
//                         value={docsLimit}
//                         onChange={(e) =>
//                           setDocsLimit(
//                             Number(e.target.value) > 0 ? Number(e.target.value) : 1
//                           )
//                         }
//                         className="w-16 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-sky-500"
//                       />
//                     </label>
//                     <button
//                       onClick={() =>
//                         selectedDb &&
//                         selectedCollection &&
//                         fetchDocuments(selectedDb, selectedCollection, docsLimit)
//                       }
//                       disabled={!selectedDb || !selectedCollection}
//                       className="text-[11px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
//                     >
//                       Reload
//                     </button>
//                   </div>
//                 </div>

//                 <div className="p-3">
//                   <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-3 max-h-80 overflow-auto">
//                     {documentsLoading ? (
//                       <p className="text-xs text-slate-400 italic">Loading documents…</p>
//                     ) : !selectedDb || !selectedCollection ? (
//                       <p className="text-xs text-slate-500">
//                         Select a database and collection in the left panel to preview documents.
//                       </p>
//                     ) : documents.length === 0 ? (
//                       <p className="text-xs text-slate-500">
//                         No documents found. The collection might be empty.
//                       </p>
//                     ) : (
//                       <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap">
//                         {JSON.stringify(documents, null, 2)}
//                       </pre>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Relations viewer */}
//               <div className="rounded-2xl border border-slate-800 bg-slate-950/80 shadow-sm">
//                 <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
//                   <div>
//                     <h2 className="text-sm font-semibold">Mongoose relations</h2>
//                     <p className="text-[11px] text-slate-500">
//                       Shows <code className="font-mono text-[10px]">ref</code> links between models.
//                     </p>
//                   </div>
//                   <button
//                     onClick={fetchRelations}
//                     className="text-[11px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 font-medium hover:bg-slate-800"
//                   >
//                     Reload
//                   </button>
//                 </div>

//                 <div className="p-3 max-h-64 overflow-auto">
//                   {relationsLoading ? (
//                     <p className="text-xs text-slate-400 italic">
//                       Loading relations…
//                     </p>
//                   ) : !relations || Object.keys(relations).length === 0 ? (
//                     <p className="text-xs text-slate-500">
//                       No relations detected. Ensure your Mongoose schemas use{" "}
//                       <code className="font-mono text-[11px] text-sky-300">ref</code> for
//                       referenced models.
//                     </p>
//                   ) : (
//                     <table className="w-full text-left text-xs">
//                       <thead className="border-b border-slate-800 text-slate-400">
//                         <tr>
//                           <th className="py-2 pr-3 font-medium">Model</th>
//                           <th className="py-2 font-medium">References</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-slate-800">
//                         {Object.entries(relations).map(([modelName, refs]) => (
//                           <tr key={modelName}>
//                             <td className="py-2 pr-3 align-top font-medium text-slate-100">
//                               {modelName}
//                             </td>
//                             <td className="py-2">
//                               {Array.isArray(refs) && refs.length > 0 ? (
//                                 <div className="flex flex-wrap gap-1.5">
//                                   {refs.map((ref, idx) => (
//                                     <span
//                                       key={idx}
//                                       className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200 border border-sky-500/40"
//                                     >
//                                       {ref}
//                                     </span>
//                                   ))}
//                                 </div>
//                               ) : (
//                                 <span className="text-[11px] text-slate-500">No refs</span>
//                               )}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   )}
//                 </div>
//               </div>

//               {/* API info footer card */}
//               <div className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-sm px-4 py-3 text-[11px] text-slate-500 flex items-center justify-between">
//                 <span>Connected API base:</span>
//                 <code className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-300">
//                   {API_BASE_URL}
//                 </code>
//               </div>
//             </section>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;


import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// --- NEW: Simple Modal Component for viewing full details ---
function DocumentModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-200">Document Details</h3>
          <button onClick={onClose} className="rounded hover:bg-slate-800 p-1 text-slate-400 hover:text-white transition">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(doc, null, 2)}
          </pre>
        </div>
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-900 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [mongoUri, setMongoUri] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState(null);

  const [databases, setDatabases] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);

  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [docsLimit, setDocsLimit] = useState(10);

  // Columns for selected collection (used in Create API modal)
  const [columns, setColumns] = useState([]);
  const [columnsLoading, setColumnsLoading] = useState(false);

  // Request method dropdown & form values
  const [requestMethod, setRequestMethod] = useState("GET");
  const [apiFormValues, setApiFormValues] = useState({});

  const REQUEST_METHODS = ["GET", "POST", "PUT", "FETCH", "DELETE"];

  const [relations, setRelations] = useState(null);
  const [relationsLoading, setRelationsLoading] = useState(false);

  // New state for viewing a single document in full
  const [viewingDoc, setViewingDoc] = useState(null);

  // Create API modal visibility
  const [showApiModal, setShowApiModal] = useState(false);

  const [error, setError] = useState(null);

  const connectToCustomDb = async () => {
    if (!mongoUri) {
      setError("Please enter a MongoDB connection URI.");
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      setConnectMessage(null);

      const res = await fetch(`${API_BASE_URL}/api/introspect/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: mongoUri }),
      });

      if (!res.ok) await handleFetchError(res);
      const data = await res.json();

      setConnectMessage(data.message || "Connected to custom DB.");

      await Promise.all([fetchHealth(), fetchDatabases(), fetchRelations()]);
      setSelectedDb(null);
      setSelectedCollection(null);
      setDocuments([]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleFetchError = async (res) => {
    let body;
    try {
      body = await res.json();
    } catch {
      body = {};
    }
    throw new Error(body.message || body.error || `Request failed with status ${res.status}`);
  };

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (!res.ok) await handleFetchError(res);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error(err);
      setHealth(null);
      setError(err.message);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      setDbLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/introspect/databases`);
      if (!res.ok) await handleFetchError(res);
      const data = await res.json();
      setDatabases(data.databases || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDbLoading(false);
    }
  };

  const fetchCollections = async (dbName) => {
    if (!dbName) return;
    try {
      setCollectionsLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE_URL}/api/introspect/collections?dbName=${encodeURIComponent(dbName)}`
      );
      if (!res.ok) await handleFetchError(res);
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const fetchColumns = async (dbName, collectionName) => {
    if (!dbName || !collectionName) return;
    try {
      setColumnsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        dbName,
        collectionName,
      });
      const res = await fetch(`${API_BASE_URL}/api/introspect/colums?${params.toString()}`);
      if (!res.ok) await handleFetchError(res);
      const data = await res.json();
      setColumns(data.columns || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setColumnsLoading(false);
    }
  };

  const fetchDocuments = async (dbName, collectionName, limit = 10) => {
    if (!dbName || !collectionName) return;
    try {
      setDocumentsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        dbName,
        collectionName,
        limit: String(limit),
      });
      const res = await fetch(`${API_BASE_URL}/api/introspect/documents?${params.toString()}`);
      if (!res.ok) await handleFetchError(res);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      setRelationsLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/relations`);
      if (!res.ok) await handleFetchError(res);
      const data = await res.json();
      setRelations(data.data || {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRelationsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchDatabases();
    fetchRelations();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      setSelectedCollection(null);
      setDocuments([]);
      fetchCollections(selectedDb);
    } else {
      setCollections([]);
    }
  }, [selectedDb]);

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

  // Keep form inputs in sync with available columns
  useEffect(() => {
    setApiFormValues((prev) => {
      const next = {};
      columns.forEach((col) => {
        next[col] = prev?.[col] ?? "";
      });
      return next;
    });
  }, [columns]);

  const healthStatusColor =
    health?.status === "healthy"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
      : "bg-red-500/10 text-red-300 border-red-500/40";

  // -------- HELPER FUNCTIONS --------

  const handleFieldChange = (column, value) => {
    setApiFormValues((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const flattenObject = (obj, prefix = "", res = {}) => {
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        flattenObject(value, newKey, res);
      } else {
        res[newKey] = value;
      }
    }
    return res;
  };

  const isArrayOfObjects = (arr) => {
    return Array.isArray(arr) && arr.length > 0 && arr.every((i) => typeof i === "object" && i !== null);
  };

  const getTableColumns = (docs) => {
    const cols = new Set();
    // Always try to put _id first
    cols.add("_id");
    docs.forEach((doc) => {
      if (doc && typeof doc === "object") {
        Object.keys(doc).forEach((k) => cols.add(k));
      }
    });
    return Array.from(cols);
  };

  const formatCell = (value) => {
    if (value === null || value === undefined) return <span className="text-slate-600 italic">null</span>;
    if (typeof value === "boolean") return value ? <span className="text-emerald-400">true</span> : <span className="text-red-400">false</span>;
    if (typeof value === "number") return <span className="text-sky-300">{value}</span>;
    if (value instanceof Date) return value.toISOString();

    try {
      if (typeof value === "object") {
         return JSON.stringify(value);
      }
      return String(value);
    } catch {
      return String(value);
    }
  };

  const renderDocumentsTable = (originalDocs) => {
    if (!isArrayOfObjects(originalDocs)) {
      return <pre className="text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap">{JSON.stringify(originalDocs, null, 2)}</pre>;
    }

    // Flatten for the table view
    const docs = originalDocs.map((doc) => flattenObject(doc));
    const cols = getTableColumns(docs);

    return (
      <div className="flex flex-col h-full">
         {/* Wrapper for scrolling */}
        <div className="overflow-auto border border-slate-800 rounded-lg bg-slate-900/50 shadow-inner max-h-[500px]">
          <table className="min-w-max border-collapse">
            <thead className="bg-slate-950 sticky top-0 z-20 shadow-sm">
              <tr>
                {/* Action Column */}
                <th className="sticky left-0 z-30 bg-slate-950 px-3 py-3 text-left text-xs font-semibold text-slate-400 border-r border-b border-slate-800 w-[50px]">
                  #
                </th>
                {cols.map((col) => (
                  <th
                    key={col}
                    className={classNames(
                      "px-4 py-3 text-left text-xs font-medium text-slate-300 border-r border-b border-slate-800 whitespace-nowrap",
                      // Highlight _id column specifically
                      col === "_id" ? "sticky left-[50px] z-30 bg-slate-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]" : ""
                    )}
                  >
                     {/* Split long column names visually */}
                    <span className="font-mono text-[11px] block max-w-[200px] truncate" title={col}>{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-950/20">
              {docs.map((doc, idx) => (
                <tr 
                  key={idx} 
                  className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setViewingDoc(originalDocs[idx])} // Open original unflattened doc
                >
                  {/* Action Cell */}
                  <td className="sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900 border-r border-slate-800 px-3 py-2 text-center text-xs text-slate-500">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400">👁</span>
                  </td>

                  {cols.map((col) => (
                    <td
                      key={col}
                      className={classNames(
                        "px-4 py-2.5 text-[12px] text-slate-300 border-r border-slate-800/50 whitespace-nowrap overflow-hidden max-w-[250px]",
                         // Sticky style for _id data cell
                        col === "_id" ? "sticky left-[50px] z-10 bg-slate-950 group-hover:bg-slate-900 font-mono text-sky-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]" : ""
                      )}
                    >
                      <div className="truncate" title={typeof doc[col] === 'string' ? doc[col] : ''}>
                        {formatCell(doc[col])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 text-right">
          * Click any row to view full JSON details
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-sky-500/30">
      {/* Detail Modal */}
      {viewingDoc && <DocumentModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
      {/* Create API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-200">Create API</h3>
              <button
                onClick={() => setShowApiModal(false)}
                className="rounded hover:bg-slate-800 p-1 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-auto">
              {/* Left: columns list */}
              <div className="col-span-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="API name"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="********"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div> 
                <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900/50 p-3 max-h-[60vh]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">Columns</span>
                    {columnsLoading && <span className="text-[10px] text-sky-400">Loading…</span>}
                  </div>
                  {columns.length === 0 && !columnsLoading ? (
                    <p className="text-[11px] text-slate-500">
                      {selectedDb && selectedCollection
                        ? "No columns detected in this collection."
                        : "Select a database and collection first."}
                    </p>
                  ) : (
                    <ul className="space-y-1 text-[12px] text-slate-200">
                      {columns.map((col) => (
                        <li
                          key={col}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 flex items-center gap-2"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                          <span className="font-mono truncate">{col}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right: request body & table */}
              <div className="col-span-9 flex flex-col gap-4 overflow-hidden">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200">
                        Request
                      </span>
                      <select
                        value={requestMethod}
                        onChange={(e) => setRequestMethod(e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                      >
                        {REQUEST_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedDb && selectedCollection
                        ? `${selectedDb} / ${selectedCollection}`
                        : "Select DB & Collection"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[12px] text-slate-200 space-y-3 max-h-[220px] overflow-auto">
                    {columns.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No fields available. Select a collection.</p>
                    ) : (
                      columns.map((col) => (
                        <div key={col} className="flex flex-col gap-1">
                          <label className="text-[11px] text-slate-400 font-medium">{col}</label>
                          <input
                            type="text"
                            value={apiFormValues[col] ?? ""}
                            onChange={(e) => handleFieldChange(col, e.target.value)}
                            placeholder={`Enter ${col}`}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-500"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-200">Table</h4>
                    <button
                      onClick={() =>
                        selectedDb &&
                        selectedCollection &&
                        Promise.all([
                          fetchDocuments(selectedDb, selectedCollection, docsLimit),
                          fetchColumns(selectedDb, selectedCollection),
                        ])
                      }
                      disabled={!selectedDb || !selectedCollection}
                      className="text-[11px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto border border-dashed border-slate-800 rounded-xl bg-slate-900/50 p-3 max-h-[40vh]">
                    {documentsLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
                        <p className="text-xs text-slate-500">Loading documents…</p>
                      </div>
                    ) : documents.length === 0 ? (
                      <p className="text-xs text-slate-500">No data to display.</p>
                    ) : (
                      renderDocumentsTable(documents)
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 px-4 py-3 bg-slate-900 flex justify-end">
              <button
                onClick={() => setShowApiModal(false)}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.12),_transparent_45%)]" />

      <div className="relative z-10">
        <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center w-full max-w-xl">
              <div className="flex-1">
                <label className="text-[11px] text-slate-400 block mb-1">MongoDB connection URI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="mongodb+srv://..."
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    onClick={connectToCustomDb}
                    disabled={connecting || !mongoUri}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
                  >
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
              <button
                onClick={() => {
                  fetchHealth();
                  fetchDatabases();
                  fetchRelations();
                  if (selectedDb) fetchCollections(selectedDb);
                  if (selectedDb && selectedCollection) fetchDocuments(selectedDb, selectedCollection, docsLimit);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition"
              >
                <span className="text-sm">⟳</span> Refresh
              </button>

              <button
                onClick={() => {
                  if (!selectedDb || !selectedCollection) {
                    setError("Select a database and collection before creating an API.");
                    return;
                  }
                  fetchColumns(selectedDb, selectedCollection);
                  if (documents.length === 0) {
                    fetchDocuments(selectedDb, selectedCollection, docsLimit);
                  }
                  setShowApiModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/60 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-500/20 transition"
              >
                Create API
              </button>

              <div
                className={classNames(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] shadow-sm",
                  health ? healthStatusColor : "border-slate-700 text-slate-400 bg-slate-900/80"
                )}
              >
                {healthLoading ? (
                  <span className="italic">Checking...</span>
                ) : health ? (
                  <>
                    <span className={classNames("inline-block h-2 w-2 rounded-full", health.status === "healthy" ? "bg-emerald-400" : "bg-red-400")} />
                    <span className="font-semibold">{health.status === "healthy" ? "Healthy" : "Down"}</span>
                  </>
                ) : (
                  <span>Unavailable</span>
                )}
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
                  {databases.length === 0 && !dbLoading && (
                    <p className="text-xs text-slate-500 px-2 py-2">No databases found.</p>
                  )}
                  <div className="space-y-1">
                    {databases.map((db) => (
                      <button
                        key={db.name}
                        onClick={() => setSelectedDb(db.name)}
                        className={classNames(
                          "w-full text-left rounded-lg px-3 py-2 text-xs border transition flex items-center justify-between group",
                          selectedDb === db.name 
                            ? "border-sky-500/50 bg-sky-500/10 text-sky-100 shadow-[0_0_10px_-3px_rgba(14,165,233,0.3)]" 
                            : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        )}
                      >
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
                        <button
                          key={col}
                          onClick={() => setSelectedCollection(col)}
                          className={classNames(
                            "w-full text-left rounded-lg px-3 py-2 text-xs border transition flex items-center",
                            selectedCollection === col 
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]" 
                              : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                          )}
                        >
                          <span className="font-medium truncate">{col}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT (Table & Relations) */}
            <section className="lg:col-span-9 space-y-6">
              
              {/* Documents Table Viewer */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm flex flex-col">
                <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 rounded-t-2xl">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">Documents Preview</h2>
                    <p className="text-[11px] text-slate-500">
                      {selectedDb && selectedCollection ? `${selectedDb} > ${selectedCollection}` : 'Select a collection'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg border border-slate-800 px-2 py-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Limit</span>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={docsLimit}
                        onChange={(e) => setDocsLimit(Number(e.target.value) > 0 ? Number(e.target.value) : 1)}
                        className="w-12 bg-transparent text-xs text-slate-200 outline-none text-right font-mono"
                      />
                    </div>
                    <button
                      onClick={() => selectedDb && selectedCollection && fetchDocuments(selectedDb, selectedCollection, docsLimit)}
                      disabled={!selectedDb || !selectedCollection}
                      className="text-[11px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Reload Data
                    </button>
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
                    // RENDER TABLE
                    renderDocumentsTable(documents)
                  )}
                </div>
              </div>

              {/* Relations & Footer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Relations Viewer */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm flex flex-col h-[200px]">
                   <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                    <h2 className="text-sm font-semibold text-slate-200">Mongoose Relations</h2>
                    <button onClick={fetchRelations} className="text-[10px] text-slate-400 hover:text-white transition">Refresh</button>
                  </div>
                  <div className="p-3 overflow-auto flex-1 custom-scrollbar">
                    {relationsLoading ? (
                      <p className="text-xs text-slate-400 italic p-2">Loading relations…</p>
                    ) : !relations || Object.keys(relations).length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                         <p className="text-xs text-slate-600">No schema relations detected.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-slate-800/50">
                          {Object.entries(relations).map(([modelName, refs]) => (
                            <tr key={modelName}>
                              <td className="py-2 pr-3 align-top font-medium text-sky-200/80">{modelName}</td>
                              <td className="py-2">
                                {Array.isArray(refs) && refs.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {refs.map((ref, idx) => (
                                      <span key={idx} className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                                        → {ref}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-600">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* API Info / Status */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 shadow-sm p-4 flex flex-col justify-center h-[200px]">
                   <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Connection Info</h3>
                   <div className="space-y-3">
                     <div>
                       <label className="text-[10px] text-slate-500 block mb-1">API Base URL</label>
                       <code className="block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] text-sky-300/90 font-mono">
                         {API_BASE_URL}
                       </code>
                     </div>
                     <div>
                       <label className="text-[10px] text-slate-500 block mb-1">Status</label>
                        <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`}></div>
                           <span className="text-xs text-slate-300">{health?.status === 'healthy' ? 'System Operational' : 'System Issues'}</span>
                        </div>
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

export default App;
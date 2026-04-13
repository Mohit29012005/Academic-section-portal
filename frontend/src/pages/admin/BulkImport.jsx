import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Database, Search, Loader2, Edit2, Trash2, Plus, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';

const BulkImport = () => {
  const [dbTables, setDbTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  const loadDbTables = async () => {
    try {
      const res = await adminAPI.dbTables();
      setDbTables(res.data.tables || []);
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  const loadTableData = async (tableName, page = 1) => {
    setDbLoading(true);
    try {
      const res = await adminAPI.dbTableRecords(tableName, {
        page,
        limit: 50,
        search: tableSearch,
      });
      setTableData(res.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading table data:', err);
    }
    setDbLoading(false);
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setTableSearch('');
    setCurrentPage(1);
    loadTableData(table.table_name, 1);
  };

  const handleSearch = () => {
    if (selectedTable) {
      loadTableData(selectedTable.table_name, 1);
    }
  };

  const handleAddRecord = () => {
    const emptyData = {};
    tableData?.columns?.forEach(col => {
      if (col !== 'id') emptyData[col] = '';
    });
    setFormData(emptyData);
    setShowAddModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setShowAddModal(true);
  };

  const handleDeleteConfirm = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const handleSaveAdd = async () => {
    setModalLoading(true);
    try {
      await adminAPI.dbCreateRecord(selectedTable.table_name, formData);
      alert('Record added successfully!');
      setShowAddModal(false);
      setShowEditModal(false);
      loadTableData(selectedTable.table_name, currentPage);
      loadDbTables();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setModalLoading(false);
  };

  const handleSaveEdit = async () => {
    setModalLoading(true);
    try {
      await adminAPI.dbUpdateRecord(selectedTable.table_name, editingRecord.id, formData);
      alert('Record updated successfully!');
      setShowEditModal(false);
      loadTableData(selectedTable.table_name, currentPage);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setModalLoading(false);
  };

  const handleDelete = async () => {
    setModalLoading(true);
    try {
      await adminAPI.dbDeleteRecord(selectedTable.table_name, deletingRecord.id);
      alert('Record deleted successfully!');
      setShowDeleteModal(false);
      loadTableData(selectedTable.table_name, currentPage);
      loadDbTables();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setModalLoading(false);
  };

  const filteredTables = dbTables.filter(t => 
    t.table_name.toLowerCase().includes(tableFilter.toLowerCase()) ||
    t.model_name.toLowerCase().includes(tableFilter.toLowerCase())
  );

  const HIDDEN_COLUMNS = ['password', 'token', 'secret', 'hash', 'key', 'session_key'];

  const formatValue = (val, colName) => {
    if (val === null || val === undefined || val === '') return <span style={{ color: '#666' }}>—</span>;
    
    const lowerCol = colName.toLowerCase();
    
    if (lowerCol.includes('is_') || lowerCol.includes('has_') || lowerCol === 'status') {
      if (val === true || val === 'true' || val === 'True') {
        return <span style={{ 
          padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500,
          background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' 
        }}>Yes</span>;
      } else if (val === false || val === 'false' || val === 'False') {
        return <span style={{ 
          padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500,
          background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' 
        }}>No</span>;
      }
    }
    
    if (lowerCol.includes('_id') && val.length > 20) {
      return <span title={val}>{val.substring(0, 8)}...</span>;
    }
    
    if (lowerCol.includes('date') || lowerCol.includes('_at') || lowerCol.includes('time')) {
      try {
        const date = new Date(val);
        if (!isNaN(date)) {
          return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch { }
    }
    
    if (typeof val === 'number') {
      return <span style={{ fontFamily: 'monospace' }}>{val}</span>;
    }
    
    return String(val);
  };

  useEffect(() => {
    loadDbTables();
  }, []);

  const visibleColumns = tableData?.columns?.filter(c => !HIDDEN_COLUMNS.includes(c.toLowerCase())) || [];

  return (
    <AdminLayout>
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ borderBottom: '1px solid #EF9F27', paddingBottom: 24, marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'serif', fontSize: 28, color: '#fff', marginBottom: 8 }}>Database Explorer</h1>
          <p style={{ color: '#EF9F27', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Super Admin - Database Management & CRUD Operations</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Left Panel - Tables */}
          <div style={{ 
            background: 'rgba(26, 5, 5, 0.95)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 8, 
            overflow: 'hidden' 
          }}>
            <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#666' }} />
                <input
                  type="text"
                  placeholder="Filter tables..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', padding: '8px 8px 8px 32px', fontSize: 12, borderRadius: 6, outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.table_name === table.table_name;
                return (
                  <div
                    key={table.table_name}
                    onClick={() => handleSelectTable(table)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      margin: '4px 8px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(239,159,39,0.15)' : 'rgba(0,0,0,0.2)',
                      borderLeft: isSelected ? '3px solid #EF9F27' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#fff' }}>{table.table_name}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{table.model_name}</div>
                    <div style={{
                      display: 'inline-block', marginTop: 4,
                      padding: '1px 8px', borderRadius: 10,
                      fontSize: 10, fontWeight: 500,
                      background: table.row_count > 0 ? 'rgba(239,159,39,0.2)' : 'rgba(255,255,255,0.05)',
                      color: table.row_count > 0 ? '#EF9F27' : '#666'
                    }}>
                      {table.row_count} rows
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Data */}
          <div style={{ 
            background: 'rgba(26, 5, 5, 0.95)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 8, 
            overflow: 'hidden' 
          }}>
            {selectedTable ? (
              <>
                {/* Top Bar */}
                <div style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, color: '#EF9F27', fontWeight: 500 }}>{selectedTable.table_name}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 11,
                      background: 'rgba(239,159,39,0.2)', color: '#EF9F27'
                    }}>
                      {tableData?.total || 0} rows
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#666' }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                          width: 200, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', padding: '8px 8px 8px 32px', fontSize: 12, borderRadius: 6, outline: 'none'
                        }}
                      />
                    </div>
                    <button
                      onClick={handleAddRecord}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', background: '#EF9F27', color: '#1A0505',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      <Plus style={{ width: 14, height: 14 }} /> Add Row
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
                  {dbLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <Loader2 style={{ width: 32, height: 32, color: '#EF9F27', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : tableData?.rows?.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(0,0,0,0.5)' }}>
                        <tr>
                          <th style={{ 
                            padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, 
                            color: '#EF9F27', textTransform: 'uppercase', letterSpacing: 0.5,
                            borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap',
                            minWidth: 100
                          }}>ID</th>
                          {visibleColumns.map(col => (
                            <th key={col} style={{ 
                              padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, 
                              color: '#EF9F27', textTransform: 'uppercase', letterSpacing: 0.5,
                              borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap',
                              minWidth: 120
                            }}>{col.replace(/_/g, ' ')}</th>
                          ))}
                          <th style={{ 
                            padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, 
                            color: '#EF9F27', textTransform: 'uppercase', letterSpacing: 0.5,
                            borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, idx) => (
                          <tr key={idx} style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.1)'
                          }}>
                            <td style={{ padding: '8px 12px', fontSize: 11, color: '#EF9F27', fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.id}>
                              {row.id.substring(0, 8)}...
                            </td>
                            {visibleColumns.map(col => (
                              <td key={col} style={{ 
                                padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.8)', maxWidth: 200,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }} title={String(row[col] || '')}>
                                {formatValue(row[col], col)}
                              </td>
                            ))}
                            <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => { setEditingRecord(row); setFormData({...row}); setShowEditModal(true); }}
                                style={{ 
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                                  color: '#EF9F27', display: 'inline-flex'
                                }}
                                title="Edit"
                              >
                                <Edit2 style={{ width: 14, height: 14 }} />
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(row)}
                                style={{ 
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                                  color: '#ef4444', display: 'inline-flex', marginLeft: 8
                                }}
                                title="Delete"
                              >
                                <Trash2 style={{ width: 14, height: 14 }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                      No records found in this table
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {tableData && tableData.pages > 1 && (
                  <div style={{ 
                    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: 12, color: '#888' }}>
                      Page {tableData.current_page} of {tableData.pages}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => loadTableData(selectedTable.table_name, currentPage - 1)}
                        disabled={currentPage <= 1}
                        style={{
                          padding: 6, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4,
                          color: '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.5 : 1
                        }}
                      >
                        <ChevronLeft style={{ width: 16, height: 16 }} />
                      </button>
                      <button
                        onClick={() => loadTableData(selectedTable.table_name, currentPage + 1)}
                        disabled={currentPage >= tableData.pages}
                        style={{
                          padding: 6, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4,
                          color: '#fff', cursor: currentPage >= tableData.pages ? 'not-allowed' : 'pointer', opacity: currentPage >= tableData.pages ? 0.5 : 1
                        }}
                      >
                        <ChevronRight style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#666' }}>
                <Database style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>Select a table from the left to explore data</p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: '#1A0505', border: '1px solid #EF9F27', borderRadius: 8,
              width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '14px 16px', borderBottom: '1px solid #EF9F27',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#2D0A0A'
              }}>
                <h2 style={{ color: '#EF9F27', fontFamily: 'serif', fontSize: 18 }}>
                  {editingRecord ? 'Edit Record' : 'Add New Record'}
                </h2>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingRecord(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>
              <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {tableData?.columns?.filter(c => c !== 'id').map(col => (
                    <div key={col}>
                      <label style={{ display: 'block', color: '#EF9F27', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>
                        {col.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={formData[col] || ''}
                        onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                        style={{
                          width: '100%', background: '#3D0F0F', border: '1px solid rgba(212,175,55,0.3)',
                          color: '#fff', padding: '10px 12px', fontSize: 12, borderRadius: 4, outline: 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ 
                padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'flex-end', gap: 8
              }}>
                <button 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingRecord(null); }}
                  style={{
                    padding: '8px 16px', background: 'none', border: '1px solid #666',
                    color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={editingRecord ? handleSaveEdit : handleSaveAdd}
                  disabled={modalLoading}
                  style={{
                    padding: '8px 16px', background: '#EF9F27', border: 'none',
                    color: '#1A0505', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4,
                    display: 'flex', alignItems: 'center', gap: 6, opacity: modalLoading ? 0.5 : 1
                  }}
                >
                  {modalLoading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                  {editingRecord ? 'Save Changes' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && deletingRecord && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: '#1A0505', border: '1px solid #ef4444', borderRadius: 8,
              width: '100%', maxWidth: 400
            }}>
              <div style={{ 
                padding: '14px 16px', borderBottom: '1px solid #ef4444',
                background: '#2D0A0A'
              }}>
                <h2 style={{ color: '#ef4444', fontFamily: 'serif', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle style={{ width: 20, height: 20 }} /> Confirm Delete
                </h2>
              </div>
              <div style={{ padding: 16 }}>
                <p style={{ color: '#fff', marginBottom: 8 }}>
                  Delete record <span style={{ color: '#EF9F27', fontWeight: 600 }}>#{deletingRecord.id}</span>?
                </p>
                <p style={{ color: '#ef4444', fontSize: 11, textTransform: 'uppercase' }}>
                  This action cannot be undone.
                </p>
              </div>
              <div style={{ 
                padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'flex-end', gap: 8
              }}>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    padding: '8px 16px', background: 'none', border: '1px solid #666',
                    color: '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={modalLoading}
                  style={{
                    padding: '8px 16px', background: '#ef4444', border: 'none',
                    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4,
                    display: 'flex', alignItems: 'center', gap: 6, opacity: modalLoading ? 0.5 : 1
                  }}
                >
                  {modalLoading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
};

export default BulkImport;

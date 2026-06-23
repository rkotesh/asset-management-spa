import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { pageVariant, staggerContainer, cardVariant, fadeIn, scaleUp } from '../animations/variants';
import { 
  ShieldAlert, CheckCircle, Clock, Calendar, User, Mail, 
  MessageSquare, AlertCircle, Loader2, GitMerge, FileCode, 
  Terminal, Eye, RefreshCw, X, Play, AlertTriangle 
} from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  // Tab State: 'queries' | 'workflows' | 'logs'
  const [activeTab, setActiveTab] = useState('queries');
  
  // Support Queries State
  const [queries, setQueries] = useState([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  // Workflows State
  const [workflows, setWorkflows] = useState([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowJson, setWorkflowJson] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Execution Logs State
  const [executions, setExecutions] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isRetryingId, setIsRetryingId] = useState(null);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <Navigate to="/assets" replace />;
  }

  // Fetch support queries
  const fetchQueries = async () => {
    setIsLoadingQueries(true);
    try {
      const res = await apiClient.get('/queries');
      setQueries(res.data.queries);
    } catch (err) {
      addToast(err.message || 'Failed to fetch support queries.', 'error');
    } finally {
      setIsLoadingQueries(false);
    }
  };

  // Fetch workflows
  const fetchWorkflows = async () => {
    setIsLoadingWorkflows(true);
    try {
      const res = await apiClient.get('/workflows');
      setWorkflows(res.data.workflows);
      if (res.data.workflows.length > 0) {
        const firstWorkflow = res.data.workflows[0];
        setSelectedWorkflow(firstWorkflow);
        setWorkflowJson(JSON.stringify(firstWorkflow, null, 2));
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch workflows.', 'error');
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  // Fetch execution logs
  const fetchExecutions = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await apiClient.get('/workflows/executions');
      setExecutions(res.data.executions);
    } catch (err) {
      addToast(err.message || 'Failed to fetch workflow execution logs.', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Effect to handle tab data loading
  useEffect(() => {
    if (activeTab === 'queries') {
      fetchQueries();
    } else if (activeTab === 'workflows') {
      fetchWorkflows();
    } else if (activeTab === 'logs') {
      fetchExecutions();
    }
  }, [activeTab]);

  const handleResolve = async (queryId) => {
    setResolvingId(queryId);
    try {
      const res = await apiClient.put(`/queries/${queryId}`);
      setQueries(prev => prev.map(q => q._id === queryId ? res.data.query : q));
      addToast('Query marked as resolved successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to resolve query.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(workflowJson);
      } catch (e) {
        throw new Error('Invalid JSON layout. Please make sure quotes, commas, and braces match.');
      }

      if (!parsed.name || !parsed.trigger || !parsed.actions) {
        throw new Error('Workflow name, trigger event, and actions list are required.');
      }

      const res = await apiClient.post('/workflows', parsed);
      addToast('Workflow configuration saved successfully!', 'success');
      
      // Refresh workflows list
      const updatedWorkflows = workflows.map(w => w.name === res.data.workflow.name ? res.data.workflow : w);
      setWorkflows(updatedWorkflows);
      setSelectedWorkflow(res.data.workflow);
    } catch (err) {
      addToast(err.message || 'Failed to save workflow configuration.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRetryExecution = async (execId, e) => {
    if (e) e.stopPropagation();
    setIsRetryingId(execId);
    try {
      addToast('Workflow retry queued...', 'info');
      const res = await apiClient.post(`/workflows/executions/${execId}/retry`);
      addToast('Workflow execution rerun completed!', 'success');
      
      if (selectedLog && selectedLog._id === execId) {
        setSelectedLog(res.data.execution);
      }
      
      // Reload logs table
      await fetchExecutions();
    } catch (err) {
      addToast(err.message || 'Failed to retry workflow execution.', 'error');
    } finally {
      setIsRetryingId(null);
    }
  };

  const selectWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    setWorkflowJson(JSON.stringify(wf, null, 2));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-6xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-white font-serif">Admin Control Panel</h1>
            <span className="px-2 py-0.5 rounded-md bg-accent-500/10 border border-accent-500/20 text-[10px] font-bold text-accent-400 uppercase tracking-widest mt-1">
              restricted
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">Configure event automation, view execution audits, and manage support tickets</p>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-neutral-800 mb-8 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('queries')}
          className={`relative py-3 px-4 text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus:outline-none ${
            activeTab === 'queries' ? 'text-primary-400' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <MessageSquare size={16} />
            Support Tickets
          </span>
          {activeTab === 'queries' && (
            <motion.div
              layoutId="adminTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`relative py-3 px-4 text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus:outline-none ${
            activeTab === 'workflows' ? 'text-primary-400' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <GitMerge size={16} />
            Workflow Configurator
          </span>
          {activeTab === 'workflows' && (
            <motion.div
              layoutId="adminTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`relative py-3 px-4 text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus:outline-none ${
            activeTab === 'logs' ? 'text-primary-400' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Terminal size={16} />
            Execution Logs
          </span>
          {activeTab === 'logs' && (
            <motion.div
              layoutId="adminTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {/* TAB 1: SUPPORT TICKETS */}
        {activeTab === 'queries' && (
          <motion.div
            key="queriesTab"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isLoadingQueries ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-primary-500" />
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-3xl p-8">
                <div className="p-4 rounded-full bg-neutral-900 text-neutral-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No support tickets found</h3>
                <p className="text-sm text-neutral-400">All users are currently operating without reported issues.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-800 glass">
                  <table className="min-w-full divide-y divide-neutral-900 text-left">
                    <thead className="bg-neutral-950/80">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">User Details</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Subject</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Message</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date Submitted</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 bg-transparent">
                      {queries.map((q) => (
                        <tr key={q._id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                                {q.userId?.name ? q.userId.name[0].toUpperCase() : '?'}
                              </div>
                              <div>
                                <span className="block text-sm font-semibold text-white">{q.userId?.name || 'Unknown User'}</span>
                                <span className="block text-xs text-neutral-500">{q.userId?.email || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-neutral-200 line-clamp-1 max-w-[150px]">{q.subject}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-neutral-400 line-clamp-2 max-w-[250px]" title={q.message}>
                              {q.message}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400">
                            {formatDate(q.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              q.status === 'resolved'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              {q.status === 'resolved' ? 'Resolved' : 'Open'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            {q.status === 'open' ? (
                              <button
                                onClick={() => handleResolve(q._id)}
                                disabled={resolvingId === q._id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors inline-flex items-center space-x-1"
                              >
                                {resolvingId === q._id ? <Loader2 size={12} className="animate-spin" /> : <span>Resolve</span>}
                              </button>
                            ) : (
                              <span className="text-neutral-500 font-semibold italic">Complete</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {queries.map((q) => (
                    <div key={q._id} className="glass-card p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                            {q.userId?.name ? q.userId.name[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{q.userId?.name || 'Unknown'}</h4>
                            <span className="text-[10px] text-neutral-500">{q.userId?.email}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          q.status === 'resolved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {q.status === 'resolved' ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="block text-xs font-bold text-white truncate">{q.subject}</span>
                        <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-950/30 p-3 rounded-lg border border-neutral-900">
                          {q.message}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-neutral-900">
                        <span className="text-[10px] text-neutral-500">{formatDate(q.createdAt)}</span>
                        {q.status === 'open' && (
                          <button
                            onClick={() => handleResolve(q._id)}
                            disabled={resolvingId === q._id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: WORKFLOW CONFIGURATION */}
        {activeTab === 'workflows' && (
          <motion.div
            key="workflowsTab"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: Workflows List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="glass-card p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4">Automation Workflows</h3>
                {isLoadingWorkflows ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={20} />
                  </div>
                ) : workflows.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No workflows loaded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {workflows.map(wf => (
                      <button
                        key={wf._id}
                        onClick={() => selectWorkflow(wf)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          selectedWorkflow?.name === wf.name
                            ? 'bg-primary-600/10 border-primary-500/30 text-white'
                            : 'bg-transparent border-neutral-800 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-extrabold uppercase tracking-wide truncate max-w-[150px]">{wf.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                            wf.isActive 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
                          }`}>
                            {wf.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-1">Trigger: <span className="text-primary-400 font-semibold">{wf.trigger?.event}</span></p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Code Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col h-[70vh]">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileCode size={18} className="text-primary-400" />
                      <span>JSON Editor</span>
                    </h3>
                    <p className="text-[10px] text-neutral-400">Modify the structured event-driven workflow definition</p>
                  </div>
                  
                  {selectedWorkflow && (
                    <button
                      onClick={handleSaveConfig}
                      disabled={isSavingConfig}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow shadow-primary-500/10"
                    >
                      {isSavingConfig ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      <span>Save Config</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 rounded-xl overflow-hidden border border-neutral-800 bg-black/40">
                  <textarea
                    value={workflowJson}
                    onChange={(e) => setWorkflowJson(e.target.value)}
                    className="w-full h-full p-4 font-mono text-xs text-neutral-300 bg-transparent resize-none focus:outline-none"
                    placeholder="{ ... }"
                    disabled={isSavingConfig}
                    style={{ whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: EXECUTION LOGS */}
        {activeTab === 'logs' && (
          <motion.div
            key="logsTab"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isLoadingLogs ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-primary-500" />
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-3xl p-8">
                <div className="p-4 rounded-full bg-neutral-900 text-neutral-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No execution audits found</h3>
                <p className="text-sm text-neutral-400">Trigger events (like file uploads) will write step execution status audits here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-800 glass">
                  <table className="min-w-full divide-y divide-neutral-900 text-left">
                    <thead className="bg-neutral-950/80">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Workflow</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Trigger Event</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Execution Date</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 bg-transparent">
                      {executions.map((log) => (
                        <tr 
                          key={log._id} 
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-neutral-900/30 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-white">{log.workflowName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono text-neutral-400">{log.triggerEvent}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400">
                            {log.durationMs}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              log.status === 'completed'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : log.status === 'skipped'
                                ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {log.status === 'completed' ? 'Completed' : log.status === 'skipped' ? 'Skipped' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={13} />
                              </button>
                              {log.status === 'failed' && (
                                <button
                                  onClick={(e) => handleRetryExecution(log._id, e)}
                                  disabled={isRetryingId === log._id}
                                  className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg transition-colors inline-flex items-center justify-center"
                                  title="Retry Execution"
                                >
                                  {isRetryingId === log._id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={13} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Execution Cards */}
                <div className="md:hidden space-y-4">
                  {executions.map((log) => (
                    <div 
                      key={log._id} 
                      onClick={() => setSelectedLog(log)}
                      className="glass-card p-5 rounded-2xl space-y-3 relative cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{log.workflowName}</h4>
                          <span className="text-[10px] font-mono text-neutral-500">{log.triggerEvent}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          log.status === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : log.status === 'skipped'
                            ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-3 border-t border-neutral-900">
                        <span>{formatDate(log.createdAt)} ({log.durationMs}ms)</span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            className="px-2 py-1 bg-neutral-800 text-[10px] font-semibold text-neutral-300 rounded-lg"
                          >
                            Details
                          </button>
                          {log.status === 'failed' && (
                            <button
                              onClick={(e) => handleRetryExecution(log._id, e)}
                              disabled={isRetryingId === log._id}
                              className="px-2 py-1 bg-rose-600 text-[10px] font-semibold text-white rounded-lg flex items-center gap-1"
                            >
                              {isRetryingId === log._id ? <Loader2 size={8} className="animate-spin" /> : 'Retry'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL AUDIT LOG MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            <motion.div
              variants={scaleUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card w-full max-w-2xl p-6 rounded-2xl shadow-2xl relative overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
              
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Terminal size={20} className="text-primary-400" />
                    <span>Audit Execution Log</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Workflow: <span className="font-semibold text-white">{selectedLog.workflowName}</span></p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content Scroll */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Status Card Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-950/40 p-4 rounded-xl border border-neutral-900">
                  <div>
                    <span className="block text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Event Status</span>
                    <span className={`inline-flex items-center text-xs font-bold mt-1 ${
                      selectedLog.status === 'completed' ? 'text-emerald-400' : selectedLog.status === 'skipped' ? 'text-sky-400' : 'text-rose-400'
                    }`}>
                      {selectedLog.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Duration</span>
                    <span className="text-xs font-bold text-neutral-300 mt-1 block">{selectedLog.durationMs} ms</span>
                  </div>

                  <div className="col-span-2">
                    <span className="block text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Completed Timestamp</span>
                    <span className="text-xs font-semibold text-neutral-300 mt-1 block">{formatDate(selectedLog.createdAt)}</span>
                  </div>
                </div>

                {/* Event Payload */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-2">Trigger Payload Parameters</h4>
                  <pre className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 font-mono text-[10px] text-neutral-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>

                {/* Workflow Global Error if Failed */}
                {selectedLog.error && (
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-start space-x-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-xs font-bold">Workflow Execution Interrupted</span>
                      <p className="text-xs mt-1 text-rose-300 font-mono">{selectedLog.error}</p>
                    </div>
                  </div>
                )}

                {/* Steps Details Timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-2">Step Execution Sequence</h4>
                  
                  {selectedLog.steps && selectedLog.steps.length > 0 ? (
                    selectedLog.steps.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-300 flex items-center justify-center border border-neutral-700">
                              {step.step}
                            </span>
                            <span className="text-xs font-extrabold text-white uppercase">{step.action}</span>
                          </div>
                          
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                            step.status === 'completed' 
                              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                          }`}>
                            {step.status}
                          </span>
                        </div>

                        {step.error && (
                          <p className="text-[10px] text-rose-400 bg-rose-500/5 p-2 rounded border border-rose-500/10 font-mono mb-2">
                            Error: {step.error}
                          </p>
                        )}

                        {step.output && (
                          <div className="mt-2">
                            <span className="block text-[9px] text-neutral-500 font-bold mb-1 uppercase tracking-wide">Output Results</span>
                            <pre className="p-3 rounded-lg bg-neutral-950/60 font-mono text-[9px] text-neutral-400 overflow-x-auto max-h-40">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 italic">No steps were executed (skipped before start).</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 rounded-lg transition-colors"
                >
                  Close Audit
                </button>
                {selectedLog.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => handleRetryExecution(selectedLog._id)}
                    disabled={isRetryingId === selectedLog._id}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow shadow-primary-500/10"
                  >
                    {isRetryingId === selectedLog._id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    <span>Rerun Workflow</span>
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPage;

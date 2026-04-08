import React, { useDeferredValue, useMemo, useRef, useState } from 'react';
import './Resources.css';
import {
  addResource,
  uploadResourceFile,
  updateResource,
  deleteResource
} from '../firebase/firebaseService';

const MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024;

const RESOURCE_TYPES = [
  { value: 'link', label: 'Link' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'text', label: 'Text' },
  { value: 'other', label: 'Other' }
];

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];

const createInitialForm = () => ({
  title: '',
  subject: '',
  type: 'link',
  sourceMode: 'link',
  linkUrl: '',
  notes: '',
  status: 'Not Started',
  progress: 0,
  resumePoint: '',
  selectedFile: null,
  fileUrl: '',
  storagePath: '',
  fileDataUrl: '',
  fileName: '',
  mimeType: '',
  fileSize: 0,
  previewText: ''
});

const formatDate = (value, fallback = 'Not yet') => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const clampProgress = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
};

const deriveStatusFromProgress = (progress) => {
  if (progress >= 100) return 'Completed';
  if (progress > 0) return 'In Progress';
  return 'Not Started';
};

const syncProgressWithStatus = (progress, status) => {
  const normalizedProgress = clampProgress(progress);
  if (status === 'Completed') return 100;
  if (status === 'Not Started') return 0;
  if (normalizedProgress === 100) return 90;
  return normalizedProgress;
};

const getResourceHref = (resource) => resource.linkUrl || resource.fileUrl || resource.fileDataUrl || '';

const getResourceTypeFromFile = (file) => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';

  if (
    mimeType.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.json')
  ) {
    return 'text';
  }

  if (
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.ppt') ||
    fileName.endsWith('.pptx') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.xlsx')
  ) {
    return 'document';
  }

  return 'other';
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });

const getPreviewLabel = (type) => {
  const labels = {
    link: 'Link resource',
    image: 'Image resource',
    video: 'Video resource',
    pdf: 'PDF resource',
    document: 'Study document',
    text: 'Text note',
    other: 'Saved resource'
  };

  return labels[type] || labels.other;
};

const getSubjectPalette = (subject) => {
  const palettes = [
    { background: 'rgba(15, 118, 110, 0.14)', color: '#115e59' },
    { background: 'rgba(99, 102, 241, 0.14)', color: '#4338ca' },
    { background: 'rgba(234, 88, 12, 0.14)', color: '#c2410c' },
    { background: 'rgba(190, 24, 93, 0.14)', color: '#9d174d' },
    { background: 'rgba(8, 145, 178, 0.14)', color: '#155e75' }
  ];

  const index = subject
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;

  return palettes[index];
};

const getStatusClassName = (status) => {
  if (status === 'Completed') return 'completed';
  if (status === 'In Progress') return 'progress';
  return 'idle';
};

const ResourcePreview = ({ resource }) => {
  const href = getResourceHref(resource);
  const previewSource = resource.fileUrl || resource.fileDataUrl;

  if (resource.type === 'image' && previewSource) {
    return (
      <div className="ResourceVisual ResourceVisualImage">
        <img src={previewSource} alt={resource.title} />
      </div>
    );
  }

  if (resource.type === 'video' && previewSource) {
    return (
      <div className="ResourceVisual ResourceVisualVideo">
        <video controls preload="metadata" src={previewSource} />
      </div>
    );
  }

  return (
    <div className={`ResourceVisual ResourceVisualFallback ${resource.type}`}>
      <span className="ResourceVisualEyebrow">{resource.type.toUpperCase()}</span>
      <h3>{getPreviewLabel(resource.type)}</h3>
      <p>
        {resource.fileName
          ? `${resource.fileName} - ${Math.max(1, Math.round((resource.fileSize || 0) / 1024))} KB`
          : href
            ? 'Open the saved source in a new tab'
            : 'Track notes and resume position inside your dashboard'}
      </p>
    </div>
  );
};

const Resources = ({ user, resources = [] }) => {
  const resourceFileInputRef = useRef(null);
  const [form, setForm] = useState(createInitialForm);
  const [resourceDrafts, setResourceDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(
      resources
        .map((resource) => resource.subject?.trim())
        .filter(Boolean)
    );

    return ['All', ...Array.from(uniqueSubjects).sort((first, second) => first.localeCompare(second))];
  }, [resources]);

  const stats = useMemo(() => {
    const total = resources.length;
    const inProgress = resources.filter((resource) => resource.status === 'In Progress').length;
    const completed = resources.filter((resource) => resource.status === 'Completed').length;
    const subjectsCount = Math.max(0, subjects.length - 1);
    const continueCount = resources.filter((resource) => {
      const progress = clampProgress(resource.progress);
      return progress > 0 && progress < 100;
    }).length;

    return { total, inProgress, completed, subjectsCount, continueCount };
  }, [resources, subjects.length]);

  const continueResource = useMemo(() => {
    const sortedResources = [...resources].sort((first, second) => {
      const firstDate = first.lastStudiedAt ? new Date(first.lastStudiedAt).getTime() : 0;
      const secondDate = second.lastStudiedAt ? new Date(second.lastStudiedAt).getTime() : 0;
      return secondDate - firstDate;
    });

    return (
      sortedResources.find((resource) => {
        const progress = clampProgress(resource.progress);
        return progress > 0 && progress < 100;
      }) || null
    );
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const nextResources = resources.filter((resource) => {
      const matchesSubject = subjectFilter === 'All' || resource.subject === subjectFilter;
      const matchesStatus = statusFilter === 'All' || resource.status === statusFilter;
      const haystack = [
        resource.title,
        resource.subject,
        resource.notes,
        resource.resumePoint,
        resource.fileName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

      return matchesSubject && matchesStatus && matchesSearch;
    });

    return nextResources.sort((first, second) => {
      if (sortBy === 'title') {
        return first.title.localeCompare(second.title);
      }
      if (sortBy === 'progress') {
        return clampProgress(second.progress) - clampProgress(first.progress);
      }
      if (sortBy === 'subject') {
        return (first.subject || '').localeCompare(second.subject || '');
      }

      const firstDate = first.updatedAt ? new Date(first.updatedAt).getTime() : 0;
      const secondDate = second.updatedAt ? new Date(second.updatedAt).getTime() : 0;
      return secondDate - firstDate;
    });
  }, [resources, deferredSearch, subjectFilter, statusFilter, sortBy]);

  const handleInputChange = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const resetForm = () => {
    setForm(createInitialForm());
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      setError('This file is too large to upload right now. Choose a file under 25 MB.');
      event.target.value = '';
      return;
    }

    try {
      setError('');
      const nextType = getResourceTypeFromFile(file);
      const shouldPreviewInline = nextType === 'image' || nextType === 'video';
      const dataUrl = shouldPreviewInline ? await readFileAsDataUrl(file) : '';
      const previewText = nextType === 'text' ? (await file.text()).slice(0, 240) : '';

      setForm((currentForm) => ({
        ...currentForm,
        sourceMode: 'upload',
        type: nextType,
        selectedFile: file,
        fileUrl: '',
        storagePath: '',
        fileDataUrl: dataUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        previewText
      }));
    } catch (fileError) {
      setError(fileError.message || 'Unable to process the selected file.');
    } finally {
      event.target.value = '';
    }
  };

  const openResourceFilePicker = () => {
    resourceFileInputRef.current?.click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.uid) {
      setError('Sign in to save resources.');
      return;
    }

    const title = form.title.trim();
    const subject = form.subject.trim();
    const notes = form.notes.trim();
    const resumePoint = form.resumePoint.trim();
    const progress = syncProgressWithStatus(form.progress, form.status);
    const status = form.status || deriveStatusFromProgress(progress);

    if (!title || !subject) {
      setError('Add both a title and a subject so the resource can be organised properly.');
      return;
    }

    if (form.sourceMode === 'link' && !form.linkUrl.trim()) {
      setError('Add a valid resource link or switch to file upload.');
      return;
    }

    if (form.sourceMode === 'upload' && !form.selectedFile) {
      setError('Choose a file to upload or switch back to link mode.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      let uploadedFileData = null;

      if (form.sourceMode === 'upload') {
        uploadedFileData = await uploadResourceFile(user.uid, form.selectedFile);
      }

      await addResource(user.uid, {
        title,
        subject,
        type: form.type,
        sourceMode: form.sourceMode,
        linkUrl: form.sourceMode === 'link' ? form.linkUrl.trim() : '',
        notes,
        status,
        progress,
        resumePoint,
        fileUrl: form.sourceMode === 'upload' ? uploadedFileData?.fileUrl || '' : '',
        storagePath: form.sourceMode === 'upload' ? uploadedFileData?.storagePath || '' : '',
        fileDataUrl: '',
        fileName: form.sourceMode === 'upload' ? uploadedFileData?.fileName || form.fileName : '',
        mimeType: form.sourceMode === 'upload' ? uploadedFileData?.mimeType || form.mimeType : '',
        fileSize: form.sourceMode === 'upload' ? uploadedFileData?.fileSize || form.fileSize : 0,
        previewText: form.sourceMode === 'upload' ? form.previewText : '',
        lastStudiedAt: progress > 0 ? new Date() : null,
        lastOpenedAt: null
      });

      resetForm();
    } catch (submitError) {
      setError(submitError.message || 'Unable to save the resource right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDraftChange = (resourceId, field, value) => {
    setResourceDrafts((currentDrafts) => ({
      ...currentDrafts,
      [resourceId]: {
        ...currentDrafts[resourceId],
        [field]: value
      }
    }));
  };

  const getDraft = (resource) => ({
    subject: resource.subject || '',
    progress: clampProgress(resource.progress),
    resumePoint: resource.resumePoint || '',
    status: resource.status || deriveStatusFromProgress(resource.progress),
    notes: resource.notes || '',
    ...(resourceDrafts[resource.id] || {})
  });

  const handleSaveResource = async (resource) => {
    if (!user?.uid) return;

    const draft = getDraft(resource);
    const progress = syncProgressWithStatus(draft.progress, draft.status);
    const nextStatus = draft.status || deriveStatusFromProgress(progress);

    try {
      setError('');
      await updateResource(user.uid, resource.id, {
        subject: draft.subject.trim() || resource.subject,
        progress,
        status: nextStatus,
        resumePoint: draft.resumePoint.trim(),
        notes: draft.notes.trim(),
        lastStudiedAt: progress > 0 ? new Date() : resource.lastStudiedAt || null
      });
    } catch (saveError) {
      setError(saveError.message || 'Unable to update that resource.');
    }
  };

  const handleOpenResource = async (resource) => {
    if (!user?.uid) return;

    const href = getResourceHref(resource);
    if (!href) return;

    try {
      const nextStatus = resource.status === 'Not Started' ? 'In Progress' : resource.status;
      await updateResource(user.uid, resource.id, {
        status: nextStatus,
        lastOpenedAt: new Date(),
        lastStudiedAt: new Date()
      });
      window.open(href, '_blank', 'noopener,noreferrer');
    } catch (openError) {
      setError(openError.message || 'Unable to open the selected resource.');
    }
  };

  const handleDeleteResource = async (resource) => {
    if (!user?.uid) return;

    const confirmed = window.confirm(`Delete "${resource.title}" from your resources?`);
    if (!confirmed) return;

    try {
      setError('');
      await deleteResource(user.uid, resource.id, resource.storagePath);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete that resource.');
    }
  };

  if (!user) {
    return (
      <div className="ResourcesShell">
        <div className="ResourcesContent">
          <div className="ResourcesSigninCard">
            <h1>Resources</h1>
            <p>Sign in to build your study library, organise by subject, and continue from the exact point where you stopped.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ResourcesShell">
      <div className="ResourcesAmbient ResourcesAmbientOne"></div>
      <div className="ResourcesAmbient ResourcesAmbientTwo"></div>

      <div className="ResourcesContent">
        <section className="ResourcesHero">
          <div className="ResourcesHeroIntro">
            <span className="SectionEyebrow">Smart study library</span>
            <h1>Keep every study resource in one focused place.</h1>
            <p>
              Save links or lightweight files, classify them manually by subject, and keep a resume note so you can jump back in without losing momentum.
            </p>

            <div className="ResourcesStatsGrid">
              <div className="ResourcesStatCard">
                <span className="ResourcesStatLabel">Total resources</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="ResourcesStatCard">
                <span className="ResourcesStatLabel">In progress</span>
                <strong>{stats.inProgress}</strong>
              </div>
              <div className="ResourcesStatCard">
                <span className="ResourcesStatLabel">Completed</span>
                <strong>{stats.completed}</strong>
              </div>
              <div className="ResourcesStatCard">
                <span className="ResourcesStatLabel">Subjects</span>
                <strong>{stats.subjectsCount}</strong>
              </div>
            </div>
          </div>

          <div className="ContinueCard">
            <span className="SectionEyebrow">Continue studying</span>
            {continueResource ? (
              <>
                <h2>{continueResource.title}</h2>
                <p>{continueResource.subject}</p>
                <div className="ContinueMeta">
                  <span>{clampProgress(continueResource.progress)}% complete</span>
                  <span>{continueResource.resumePoint || 'Resume point not added yet'}</span>
                </div>
                <button
                  type="button"
                  className="PrimaryAction"
                  onClick={() => handleOpenResource(continueResource)}
                >
                  Continue resource
                </button>
              </>
            ) : (
              <>
                <h2>No paused resource yet</h2>
                <p>Add your first item and start building a reusable study archive.</p>
                <div className="ContinueMeta">
                  <span>{stats.continueCount} partially studied resources</span>
                  <span>Resume notes will appear here</span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="ResourceWorkspace">
          <div className="ResourceFormCard">
            <div className="CardHeader">
              <div>
                <span className="SectionEyebrow">Add resource</span>
                <h2>Store a link or a lightweight file</h2>
              </div>
              <p>Files are uploaded to Firebase Storage and the resource details stay in Firestore, so you can save real study files and still manage them from one place.</p>
            </div>

            <form className="ResourceForm" onSubmit={handleSubmit}>
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => handleInputChange('title', event.target.value)}
                  placeholder="Semester 4 operating systems notes"
                />
              </label>

              <label>
                <span>Subject</span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) => handleInputChange('subject', event.target.value)}
                  placeholder="Operating Systems"
                />
              </label>

              <label>
                <span>Resource type</span>
                <select
                  value={form.type}
                  onChange={(event) => handleInputChange('type', event.target.value)}
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="InlineChoiceGroup">
                <button
                  type="button"
                  className={form.sourceMode === 'link' ? 'ChoiceButton active' : 'ChoiceButton'}
                  onClick={() => handleInputChange('sourceMode', 'link')}
                >
                  Save link
                </button>
                <button
                  type="button"
                  className={form.sourceMode === 'upload' ? 'ChoiceButton active' : 'ChoiceButton'}
                  onClick={() => handleInputChange('sourceMode', 'upload')}
                >
                  Upload file
                </button>
              </div>

              {form.sourceMode === 'link' ? (
                <label className="FullWidthField">
                  <span>Resource link</span>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(event) => handleInputChange('linkUrl', event.target.value)}
                    placeholder="https://example.com/class-notes"
                  />
                </label>
              ) : (
                <label className="FullWidthField FileField">
                  <span>Select a file</span>
                  <input
                    ref={resourceFileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="HiddenFileInput"
                  />
                  <button type="button" className="FilePickerButton" onClick={openResourceFilePicker}>
                    {form.fileName ? 'Choose another file' : 'Choose file from device'}
                  </button>
                  <div className="FilePickerStatus">
                    {form.fileName ? form.fileName : 'No file selected yet'}
                  </div>
                  {form.fileName ? (
                    <small>
                      Saved file: {form.fileName} - {Math.max(1, Math.round(form.fileSize / 1024))} KB
                    </small>
                  ) : (
                    <small>Images, short videos, text files, PDFs, Word files and similar resources work best when they stay lightweight.</small>
                  )}
                </label>
              )}

              <label>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => handleInputChange('status', event.target.value)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Progress</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(event) => handleInputChange('progress', event.target.value)}
                  placeholder="0"
                />
              </label>

              <label className="FullWidthField">
                <span>Resume from</span>
                <input
                  type="text"
                  value={form.resumePoint}
                  onChange={(event) => handleInputChange('resumePoint', event.target.value)}
                  placeholder="Page 23, 11:40, Unit 2 heading, formula set 4"
                />
              </label>

              <label className="FullWidthField">
                <span>Notes</span>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(event) => handleInputChange('notes', event.target.value)}
                  placeholder="Short summary, exam relevance, or what to revise next"
                ></textarea>
              </label>

              {error && <div className="FormError">{error}</div>}

              <div className="FormActions">
                <button type="submit" className="PrimaryAction" disabled={saving}>
                  {saving ? 'Saving...' : 'Add resource'}
                </button>
                <button type="button" className="SecondaryAction" onClick={resetForm}>
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="ResourceLibraryCard">
            <div className="CardHeader">
              <div>
                <span className="SectionEyebrow">Library</span>
                <h2>Manage your study flow</h2>
              </div>
              <p>Filter by subject, keep progress updated, and leave a resume note for the next session.</p>
            </div>

            <div className="LibraryToolbar">
              <input
                type="text"
                className="LibrarySearch"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, notes, subject, resume point"
              />

              <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject === 'All' ? 'All subjects' : subject}
                  </option>
                ))}
              </select>

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="recent">Most recent</option>
                <option value="progress">Highest progress</option>
                <option value="subject">Subject</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div className="SubjectChipRow">
              {subjects.slice(1).map((subject) => {
                const palette = getSubjectPalette(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    className={subjectFilter === subject ? 'SubjectChip active' : 'SubjectChip'}
                    style={{ '--chip-background': palette.background, '--chip-color': palette.color }}
                    onClick={() => setSubjectFilter(subjectFilter === subject ? 'All' : subject)}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>

            {filteredResources.length === 0 ? (
              <div className="ResourceEmptyState">
                <h3>No resources match this view.</h3>
                <p>Try changing the filters, or add your first subject-based study resource above.</p>
              </div>
            ) : (
              <div className="ResourceGrid">
                {filteredResources.map((resource) => {
                  const draft = getDraft(resource);
                  const progress = clampProgress(resource.progress);
                  const palette = getSubjectPalette(resource.subject || 'General');

                  return (
                    <article className="ResourceCard" key={resource.id}>
                      <ResourcePreview resource={resource} />

                      <div className="ResourceCardBody">
                        <div className="ResourceCardTop">
                          <div className="ResourceTagRow">
                            <span
                              className="SubjectPill"
                              style={{
                                background: palette.background,
                                color: palette.color
                              }}
                            >
                              {resource.subject}
                            </span>
                            <span className={`StatusPill ${getStatusClassName(resource.status)}`}>
                              {resource.status}
                            </span>
                          </div>

                          <h3>{resource.title}</h3>
                          <p className="ResourceNotes">{resource.notes || 'No study notes added yet.'}</p>
                        </div>

                        <div className="ResourceMetaGrid">
                          <div>
                            <span className="MetaLabel">Added</span>
                            <strong>{formatDate(resource.createdAt)}</strong>
                          </div>
                          <div>
                            <span className="MetaLabel">Last studied</span>
                            <strong>{formatDate(resource.lastStudiedAt)}</strong>
                          </div>
                          <div>
                            <span className="MetaLabel">Resume from</span>
                            <strong>{resource.resumePoint || 'Not saved yet'}</strong>
                          </div>
                          <div>
                            <span className="MetaLabel">Progress</span>
                            <strong>{progress}%</strong>
                          </div>
                        </div>

                        {resource.previewText ? (
                          <div className="PreviewTextBox">{resource.previewText}</div>
                        ) : null}

                        <div className="ProgressTrack">
                          <div className="ProgressFill" style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="ResourceManageGrid">
                          <label>
                            <span>Subject</span>
                            <input
                              type="text"
                              value={draft.subject}
                              onChange={(event) => handleDraftChange(resource.id, 'subject', event.target.value)}
                            />
                          </label>

                          <label>
                            <span>Status</span>
                            <select
                              value={draft.status}
                              onChange={(event) => handleDraftChange(resource.id, 'status', event.target.value)}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span>Progress</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={draft.progress}
                              onChange={(event) => handleDraftChange(resource.id, 'progress', event.target.value)}
                            />
                          </label>

                          <label className="FullWidthField">
                            <span>Resume point</span>
                            <input
                              type="text"
                              value={draft.resumePoint}
                              onChange={(event) => handleDraftChange(resource.id, 'resumePoint', event.target.value)}
                              placeholder="Page 52, timestamp 18:20, chapter name"
                            />
                          </label>

                          <label className="FullWidthField">
                            <span>Quick notes</span>
                            <textarea
                              rows="3"
                              value={draft.notes}
                              onChange={(event) => handleDraftChange(resource.id, 'notes', event.target.value)}
                            ></textarea>
                          </label>
                        </div>

                        <div className="ResourceActions">
                          <button
                            type="button"
                            className="PrimaryAction"
                            onClick={() => handleSaveResource(resource)}
                          >
                            Save progress
                          </button>

                          {getResourceHref(resource) ? (
                            <button
                              type="button"
                              className="SecondaryAction"
                              onClick={() => handleOpenResource(resource)}
                            >
                              Open resource
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="DangerAction"
                            onClick={() => handleDeleteResource(resource)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Resources;

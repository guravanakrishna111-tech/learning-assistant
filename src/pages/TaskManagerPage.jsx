import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import './TaskManagerPage.css'
import { saveTasks } from '../firebase/firebaseService';

const TaskManagerPage = ({ user, Tasks, setTasks }) => {
  const [input, setInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Study")
  const [selectedPriority, setSelectedPriority] = useState("Medium")
  const [deadline, setDeadline] = useState("")
  const [expandedTask, setExpandedTask] = useState(null)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = ["Study", "Work", "Personal", "Health"]
  const priorities = ["Low", "Medium", "High"]

  // Save tasks whenever they change
  useEffect(() => {
    if (!user?.uid || Tasks.length === 0) return undefined;

    let isActive = true;

    const syncTasks = async () => {
      setSaving(true);

      try {
        await saveTasks(user.uid, Tasks);
      } catch (err) {
        console.error('Error saving tasks:', err);
        if (isActive) setError('Failed to save task');
      } finally {
        if (isActive) setSaving(false);
      }
    };

    syncTasks();

    return () => {
      isActive = false;
    };
  }, [Tasks, user?.uid]);

  const addTask = () => {
    if (input.trim() === "") return;

    if (!user?.uid) {
      setError('Please sign in to add tasks');
      return;
    }

    const newTask = {
      id: Date.now(),
      text: input,
      category: selectedCategory,
      priority: selectedPriority,
      deadline: deadline,
      status: "Pending",
      completed: false,
      createdAt: new Date().toISOString()
    }

    setTasks([...Tasks, newTask])
    setInput("")
    setDeadline("")
    setSelectedCategory("Study")
    setSelectedPriority("Medium")
  }

  const deleteTask = (index) => {
    setTasks(Tasks.filter((_, i) => i !== index))
  }

  const toggleComplete = (index) => {
    const updated = [...Tasks]
    updated[index].completed = !updated[index].completed
    updated[index].status = updated[index].completed ? "Completed" : "Pending"
    setTasks(updated)
  }

  const getStatusColor = (status) => {
    switch(status) {
      case "Completed": return "#10B981"
      case "Pending": return "#F59E0B"
      default: return "#6B7280"
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "High": return "#EF4444"
      case "Medium": return "#F59E0B"
      case "Low": return "#10B981"
      default: return "#6B7280"
    }
  }

  const getCategoryEmoji = (category) => {
    const emojis = { Study: "📚", Work: "💼", Personal: "🎯", Health: "💪" }
    return emojis[category] || "📋"
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addTask()
  }

  const remainingTasks = Tasks.filter(t => !t.completed).length
  const completedCount = Tasks.filter(t => t.completed).length

  if (!user) {
    return (
      <div className='TaskManagerPageContainer'>
        <p style={{ textAlign: 'center', color: '#666' }}>
          Please <Link to="/login" style={{color:'#667eea'}}>sign in</Link> to manage tasks
        </p>
      </div>
    );
  }

  return (
    <div className='TaskManagerPageContainer'>
      <div className='TaskManagerPageContent'>
        <div className='PageHeader'>
          <h1>📝 Task Manager</h1>
          <p>Manage your tasks with priorities and deadlines</p>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        {saving && <div style={{ color: '#667eea', marginBottom: '10px' }}>💾 Saving...</div>}

        <div className='TaskStats'>
          <div className='StatBox'>
            <span>Total: {Tasks.length}</span>
          </div>
          <div className='StatBox'>
            <span>Pending: {remainingTasks}</span>
          </div>
          <div className='StatBox'>
            <span>Completed: {completedCount}</span>
          </div>
        </div>

        <div className='AddTaskForm'>
          <input
            type="text"
            placeholder='Task Title'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className='TaskInput'
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className='SelectInput'
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className='SelectInput'
          >
            {priorities.map(pri => (
              <option key={pri} value={pri}>{pri}</option>
            ))}
          </select>

          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className='SelectInput'
          />

          <button onClick={addTask} className='AddButton'>
            + Add Task
          </button>
        </div>

        <div className='TasksList'>
          <div className='FilterTabs'>
            <button className='FilterTab active'>All ({Tasks.length})</button>
            <button className='FilterTab'>Pending ({remainingTasks})</button>
            <button className='FilterTab'>Completed ({completedCount})</button>
          </div>

          {Tasks.length === 0 ? (
            <div className='EmptyState'>
              <p>📭 No tasks yet. Create one to get started!</p>
            </div>
          ) : (
            <div className='TasksGrid'>
              {Tasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className={`TaskCard ${task.completed ? 'completed' : ''}`}
                  onClick={() => setExpandedTask(expandedTask === index ? null : index)}
                >
                  <div className='TaskHeader'>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(index)}
                      onClick={(e) => e.stopPropagation()}
                      className='TaskCheckbox'
                    />
                    <span className='TaskTitle'>{task.text}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(index)
                      }}
                      className='DeleteButton'
                    >
                      ✕
                    </button>
                  </div>

                  <div className='TaskMeta'>
                    <span className='CategoryBadge'>
                      {getCategoryEmoji(task.category)} {task.category}
                    </span>
                    <span
                      className='PriorityBadge'
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                    <span
                      className='StatusBadge'
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                  </div>

                  {task.deadline && (
                    <div className='DeadlineInfo'>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        📅 Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {expandedTask === index && (
                    <div className='TaskDetails'>
                      <p><strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                      <p><strong>Category:</strong> {task.category}</p>
                      <p><strong>Priority:</strong> {task.priority}</p>
                      {task.deadline && (
                        <p><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</p>
                      )}
                      <p><strong>Status:</strong> {task.status}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskManagerPage

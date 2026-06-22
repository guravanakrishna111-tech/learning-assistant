import React from 'react'
import './TaskManager.css'
import { useState } from 'react'
const TaskManager = ({ Tasks, setTasks,score}) => {

  const [input, setInput] = useState("")

  function addTask(){
    if(input.trim() === "") return;

    setTasks([...Tasks, { text: input, completed:false }])
    setInput("")
  }

  function deleteTask(index){
    setTasks(Tasks.filter((_,i)=> i !== index))
  }
  const[streak,setStreak]=useState(0);
  function toggleComplete(index){
    const updated = [...Tasks]
    updated[index].completed = !updated[index].completed
    setTasks(updated)
    if(updated[index].completed){
      setStreak(prev=>prev+1)
    }
    else
    {
      setStreak(0);
    }
  }

  function remainingTasks(){
    return Tasks.filter(t => !t.completed).length
  }

  const handleKeyPress = (e) => {
    if(e.key === 'Enter') {
      addTask()
    }
  }
  return (
    <div>
      <h1>📋 Task Manager</h1>

      <div className='TaskManager'>
        <div className='put'>
          <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a new task..."
        />
        <button onClick={addTask}>✚ Add</button>
        </div>
        <div className='list'>
          <ul>
          <h3>✅ All Tasks</h3>

          {Tasks.length === 0 ? (
            <li style={{
              textAlign: 'center',
              justifyContent: 'center',
              color: '#999',
              cursor: 'default',
              background: 'rgba(200, 200, 200, 0.1)',
              border: 'none'
            }}>
              No tasks yet. Add one to get started! 🚀
            </li>
          ) : (
            Tasks?.map((task, i) => (
              <li
                key={i}
                className={task.completed ? 'completed' : ''}
                onClick={() => toggleComplete(i)}
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                  cursor: "pointer"
                }}
              >
                <span style={{ flex: 1 }}>
                  {task.completed ? '✓' : '○'} {task.text}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTask(i)
                  }}
                >
                  🗑 Delete
                </button>
              </li>
            ))
          )}
        </ul>
        </div>
        <div className='result'> 
        <h3>📊 You have <strong>{remainingTasks()}</strong> {remainingTasks() === 1 ? 'task' : 'tasks'} remaining</h3>
        <h3>Streak:{streak}</h3>
        <h3>Score regarding to these tasks:{score}</h3>
        </div>
      </div>
    </div>
  )
}

export default TaskManager

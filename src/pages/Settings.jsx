import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import './Settings.css'
import { getSettings, saveSettings, onSettingsChange } from '../firebase/firebaseService';
import { saveTasks } from '../firebase/firebaseService';

const Settings = ({ user, Tasks, setTasks }) => {
  console.log('Settings component render', { user, Tasks });
  const [settings, setSettings] = useState({
    darkMode: false,
    username: '',
    notifications: true,
    emailNotifications: false
  });

  const [username, setUsername] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load settings on mount
  useEffect(() => {
    if (!user?.uid) {
      setSettings({
        darkMode: false,
        username: '',
        notifications: true,
        emailNotifications: false
      });
      setUsername('');
      return undefined;
    }

    let isActive = true;

    const loadSettings = async () => {
      setLoading(true);

      try {
        const data = await getSettings(user.uid);
        if (!isActive) return;

        const loadedSettings = data || {
          darkMode: false,
          username: '',
          notifications: true,
          emailNotifications: false
        };
        setSettings(loadedSettings);
        setUsername(loadedSettings.username || '');
      } catch (err) {
        console.error('Error loading settings:', err);
        if (isActive) setError('Failed to load settings');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadSettings();

    // Real-time listener for settings changes
    const unsubscribe = onSettingsChange(user.uid, (data) => {
      const updatedSettings = data || {
        darkMode: false,
        username: '',
        notifications: true,
        emailNotifications: false
      };
      setSettings(updatedSettings);
      setUsername(updatedSettings.username || '');
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user?.uid]);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#fff';
    } else {
      document.body.style.backgroundColor = '#fff';
      document.body.style.color = '#000';
    }
  }, [settings.darkMode]);

  // Save settings to Firebase
  useEffect(() => {
    if (user?.uid && !loading) {
      saveSettings(user.uid, settings).catch(err => {
        console.error('Error saving settings:', err);
      });
    }
  }, [settings, user?.uid, loading]);

  const handleDarkModeToggle = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    setShowSuccess('Theme updated!');
    setTimeout(() => setShowSuccess(''), 2000);
  };

  const handleNotificationsToggle = () => {
    setSettings(prev => ({ ...prev, notifications: !prev.notifications }));
    setShowSuccess('Notifications ' + (!settings.notifications ? 'enabled' : 'disabled'));
    setTimeout(() => setShowSuccess(''), 2000);
  };

  const handleEmailNotificationsToggle = () => {
    setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }));
    setShowSuccess('Email notifications ' + (!settings.emailNotifications ? 'enabled' : 'disabled'));
    setTimeout(() => setShowSuccess(''), 2000);
  };

  const handleUsernameChange = () => {
    if (username.trim() === '') {
      alert('Username cannot be empty');
      return;
    }
    setSettings(prev => ({ ...prev, username }));
    setShowSuccess('Username updated successfully!');
    setTimeout(() => setShowSuccess(''), 2000);
  };

  const handleResetTasks = async () => {
    if (window.confirm('Are you sure? This will delete ALL tasks. This action cannot be undone!')) {
      try {
        setTasks([]);
        if (user?.uid) {
          await saveTasks(user.uid, []);
        }
        setShowResetConfirm(false);
        setShowSuccess('All tasks have been reset!');
        setTimeout(() => setShowSuccess(''), 3000);
      } catch (err) {
        console.error('Error resetting tasks:', err);
        setError('Failed to reset tasks');
      }
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        tasks: Tasks,
        profile: settings,
        settings: settings,
        exportDate: new Date().toISOString()
      };
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
      element.setAttribute('download', 'dashboard-data.json');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setShowSuccess('Data exported successfully!');
      setTimeout(() => setShowSuccess(''), 2000);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className='SettingsContainer'>
        <p style={{ textAlign: 'center', color: '#666' }}>
          Please <Link to="/login" style={{color:'#667eea'}}>sign in</Link> to access settings
        </p>
      </div>
    );
  }

  return (
    <div className={`SettingsContainer ${settings.darkMode ? 'dark' : ''}`}>
      <div className='SettingsContent'>
        <div className='SettingsHeader'>
          <h1>⚙️ Settings</h1>
          <p>Manage your app preferences and account</p>
        </div>

        {showSuccess && (
          <div className='SuccessMessage'>
            ✓ {showSuccess}
          </div>
        )}

        {error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        )}

        {/* Theme Settings */}
        <div className='SettingSection'>
          <div className='SectionHeader'>
            <h2>🎨 Appearance</h2>
            <p>Customize how the app looks</p>
          </div>

          <div className='SettingItem'>
            <div className='SettingLabel'>
              <span className='SettingTitle'>Dark Mode</span>
              <span className='SettingDescription'>Toggle dark theme</span>
            </div>
            <div className='ToggleSwitch'>
              <input
                type="checkbox"
                id="darkMode"
                checked={settings.darkMode}
                onChange={handleDarkModeToggle}
                className='ToggleInput'
              />
              <label htmlFor="darkMode" className='ToggleLabel'>
                <span className='ToggleSlider'></span>
              </label>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className='SettingSection'>
          <div className='SectionHeader'>
            <h2>👤 Account</h2>
            <p>Update your account information</p>
          </div>

          <div className='SettingItem'>
            <div className='SettingLabel'>
              <span className='SettingTitle'>Username</span>
              <span className='SettingDescription'>Your display name in the app</span>
            </div>
            <div className='InputGroup'>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className='SettingInput'
              />
              <button onClick={handleUsernameChange} className='SaveButton'>
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className='SettingSection'>
          <div className='SectionHeader'>
            <h2>🔔 Notifications</h2>
            <p>Control how you receive notifications</p>
          </div>

          <div className='SettingItem'>
            <div className='SettingLabel'>
              <span className='SettingTitle'>In-App Notifications</span>
              <span className='SettingDescription'>Show notifications within the app</span>
            </div>
            <div className='ToggleSwitch'>
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications}
                onChange={handleNotificationsToggle}
                className='ToggleInput'
              />
              <label htmlFor="notifications" className='ToggleLabel'>
                <span className='ToggleSlider'></span>
              </label>
            </div>
          </div>

          <div className='SettingItem'>
            <div className='SettingLabel'>
              <span className='SettingTitle'>Email Notifications</span>
              <span className='SettingDescription'>Receive updates via email</span>
            </div>
            <div className='ToggleSwitch'>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleEmailNotificationsToggle}
                className='ToggleInput'
              />
              <label htmlFor="emailNotifications" className='ToggleLabel'>
                <span className='ToggleSlider'></span>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className='SettingSection'>
          <div className='SectionHeader'>
            <h2>💾 Data Management</h2>
            <p>Manage your data and backups</p>
          </div>

          <div className='SettingItem'>
            <div className='SettingLabel'>
              <span className='SettingTitle'>Export Data</span>
              <span className='SettingDescription'>Download your tasks and settings as JSON</span>
            </div>
            <button onClick={handleExportData} className='ActionButton export'>
              📥 Export Data
            </button>
          </div>

          <div className='SettingItem'>
            <div className='SettingLabel'>
              <span className='SettingTitle'>Reset All Tasks</span>
              <span className='SettingDescription'>Delete all tasks and start fresh</span>
            </div>
            <button
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className='ActionButton danger'
            >
              🗑️ Reset Tasks
            </button>
          </div>

          {showResetConfirm && (
            <div className='ConfirmDialog'>
              <div className='DialogContent'>
                <h3>⚠️ Are you sure?</h3>
                <p>This will permanently delete all {Tasks.length} tasks. This action cannot be undone.</p>
                <div className='DialogButtons'>
                  <button
                    onClick={handleResetTasks}
                    className='ConfirmButton danger'
                  >
                    Yes, Delete All
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className='ConfirmButton cancel'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className='SettingSection'>
          <div className='SectionHeader'>
            <h2>📊 App Statistics</h2>
            <p>Your app usage overview</p>
          </div>

          <div className='StatisticsGrid'>
            <div className='StatItem'>
              <span className='StatLabel'>Total Tasks</span>
              <span className='StatValue'>{Tasks.length}</span>
            </div>
            <div className='StatItem'>
              <span className='StatLabel'>Completed</span>
              <span className='StatValue'>{Tasks.filter(t => t.completed).length}</span>
            </div>
            <div className='StatItem'>
              <span className='StatLabel'>Pending</span>
              <span className='StatValue'>{Tasks.filter(t => !t.completed).length}</span>
            </div>
            <div className='StatItem'>
              <span className='StatLabel'>Completion Rate</span>
              <span className='StatValue'>
                {Tasks.length ? Math.round((Tasks.filter(t => t.completed).length / Tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className='SettingSection about'>
          <div className='SectionHeader'>
            <h2>ℹ️ About</h2>
          </div>
          <p className='AboutText'>Dashboard Pro v1.0</p>
          <p className='AboutText'>Your personal productivity companion</p>
        </div>
      </div>
    </div>
  )
}

export default Settings

import React, { useEffect, useMemo, useRef, useState } from 'react';
import prof from '../assets/profile.jpeg';
import { Link } from 'react-router-dom';
import './Profile.css';
import { getProfile, saveProfile, onProfileChange, uploadProfileImage } from '../firebase/firebaseService';

const MAX_PROFILE_IMAGE_SIZE = 10 * 1024 * 1024;

const createEmptyProfile = () => ({
  name: '',
  mail: '',
  number: '',
  location: '',
  photoUrl: '',
  photoDataUrl: '',
  photoName: '',
  photoStoragePath: ''
});

const Profile = ({ user, score = 0, Tasks = [] }) => {
  const profileImageInputRef = useRef(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState('');
  const [profile, setProfile] = useState(createEmptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    getProfile(user.uid)
      .then((data) => {
        setProfile({ ...createEmptyProfile(), ...(data || {}) });
      })
      .catch((loadError) => {
        console.error('Error loading profile:', loadError);
        setError('Failed to load profile');
      })
      .finally(() => {
        setLoading(false);
      });

    const unsubscribe = onProfileChange(user.uid, (data) => {
      setProfile({ ...createEmptyProfile(), ...(data || {}) });
    });

    return unsubscribe;
  }, [user?.uid]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }));
  };

  const openProfileImagePicker = () => {
    profileImageInputRef.current?.click();
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the profile picture.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setError('Profile image is too large to upload right now. Choose an image under 10 MB.');
      event.target.value = '';
      return;
    }

    try {
      setError('');
      const previewUrl = URL.createObjectURL(file);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }

      setSelectedImageFile(file);
      setSelectedImagePreview(previewUrl);
      setProfile((currentProfile) => ({
        ...currentProfile,
        photoName: file.name
      }));
    } catch (imageError) {
      setError(imageError.message || 'Unable to process the selected image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      setSaving(true);

      if (!user?.uid) {
        setError('Please sign in to save profile');
        return;
      }

      let uploadedImageData = null;

      if (selectedImageFile) {
        uploadedImageData = await uploadProfileImage(user.uid, selectedImageFile);
      }

      await saveProfile(user.uid, {
        ...profile,
        ...(uploadedImageData || {})
      });
      setSelectedImageFile(null);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
        setSelectedImagePreview('');
      }
      alert('Profile saved successfully!');
    } catch (saveError) {
      console.error('Error saving profile:', saveError);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completedTasks = useMemo(() => Tasks.filter((task) => task.completed).length, [Tasks]);
  const totalTasks = Tasks.length;
  const profileImage = selectedImagePreview || profile.photoUrl || profile.photoDataUrl || prof;

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="ProfileContainer">
        <p style={{ textAlign: 'center', color: '#666' }}>
          Please <Link to="/login" style={{ color: '#667eea' }}>sign in</Link> to view your profile
        </p>
      </div>
    );
  }

  return (
    <div className="ProfileContainer">
      <div className="profile">
        <div className="profileHeader">
          <div className="ProfileImageBlock">
            <img src={profileImage} alt="profile" />
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="HiddenProfileFileInput"
            />
            <button type="button" className="ProfileImageButton" onClick={openProfileImagePicker}>
              {selectedImageFile || profile.photoUrl || profile.photoDataUrl ? 'Choose another image' : 'Choose profile image'}
            </button>
            <span className="ProfileImageMeta">
              {profile.photoName || 'No custom profile image selected'}
            </span>
          </div>

          <div className="headerInfo">
            <h2>{profile.name || 'Your Name'}</h2>
            <h4>{profile.mail || 'yourname@gmail.com'}</h4>
          </div>
        </div>

        <div className="ProfileStats">
          <div className="StatBox">
            <span className="StatLabel">Total Tasks</span>
            <span className="StatValue">{totalTasks}</span>
          </div>
          <div className="StatBox">
            <span className="StatLabel">Completed Tasks</span>
            <span className="StatValue">{completedTasks}</span>
          </div>
          <div className="StatBox">
            <span className="StatLabel">Completion Rate</span>
            <span className="StatValue">{totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
          </div>
          <div className="StatBox">
            <span className="StatLabel">Productivity Score</span>
            <span className="StatValue">{score}%</span>
          </div>
        </div>

        <div className="ProfileEditor">
          <h3>Edit Profile</h3>
          {error && <div className="ProfileError">{error}</div>}

          <div className="FormGroup">
            <label>Full Name</label>
            <input type="text" placeholder="Full Name" name="name" value={profile.name} onChange={handleChange} />
          </div>

          <div className="FormGroup">
            <label>Email Address</label>
            <input type="email" placeholder="E-mail" name="mail" value={profile.mail} onChange={handleChange} />
          </div>

          <div className="FormGroup">
            <label>Mobile Number</label>
            <input type="tel" placeholder="Mobile number" name="number" value={profile.number} onChange={handleChange} />
          </div>

          <div className="FormGroup">
            <label>Location</label>
            <input type="text" placeholder="Location" name="location" value={profile.location} onChange={handleChange} />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!profile.name || !profile.mail || saving}
            className="SaveProfileButton"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

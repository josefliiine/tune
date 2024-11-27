import { useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Header from "../components/Header";

const UserPage = () => {
  const [userName, setUserName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("No user is logged in");
      setIsSubmitting(false);
      return;
    }

    try {
      let photoURL = user.photoURL;

      if (profileImage) {
        const storage = getStorage();
        const imageRef = ref(storage, `users/${user.uid}/${profileImage.name}`);
        await uploadBytes(imageRef, profileImage);
        photoURL = await getDownloadURL(imageRef);
      }

      await updateProfile(user, {
        displayName: userName || user.displayName,
        photoURL: photoURL || user.photoURL,
      });

      setSuccessMessage("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile", error);
      setError("Error updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-page">
      <Header />
      <div className="profile-image-container">
      <h2>Update Your Profile</h2>
        <div className="image-preview">
          {previewImage ? (
            <img src={previewImage} alt="Profile preview" />
          ) : (
            <div className="placeholder">No image selected</div>
          )}
        </div>
        <input
          type="file"
          id="profile-image"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="profile-form-container">
        {error && <div className="error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user-name">Username</label>
            <input
              type="text"
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating profile..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserPage;
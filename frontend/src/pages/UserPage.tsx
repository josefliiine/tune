import { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import Header from "../components/Header.tsx";

const UserPage = () => {
  const [userName, setUserName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setPreviewImage(user.photoURL || null); // Show profile picture
      setUserName(user.displayName || ""); // Show username
    }
  }, [auth]);

  const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    const storage = getStorage();
    const imageRef = ref(storage, `users/${userId}/${file.name}`);
    await uploadBytes(imageRef, file); // Upload file to Firebase Storage
    return getDownloadURL(imageRef); // Fetch URL for the uploaded image
  };

  const updateFirestoreProfile = async (userId: string, displayName: string, photoURL: string) => {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { displayName, photoURL }, { merge: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
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

    const user = auth.currentUser;

    if (!user) {
      setError("No user is logged in.");
      setIsSubmitting(false);
      return;
    }

    try {
      let photoURL = user.photoURL || "";

      if (profileImage) {
        photoURL = await uploadProfileImage(user.uid, profileImage);
        setPreviewImage(photoURL);
      }

      const displayName = userName || user.displayName || "";

      // Update user's profile
      await updateProfile(user, { displayName, photoURL });
      await updateFirestoreProfile(user.uid, displayName, photoURL);

      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile.");
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
        <input type="file" id="profile-image" accept="image/*" onChange={handleFileChange} />
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
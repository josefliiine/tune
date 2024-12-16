import React, { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import Header from "../../components/Header";

const UserPage = () => {
  const [userName, setUserName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    await uploadBytes(imageRef, file); // Upload file to Firebase Storage
    const downloadURL = await getDownloadURL(imageRef); // Fetch URL for the uploaded image
    setIsUploading(false);
    return downloadURL;
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
    <motion.div
      className="user-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <Header />
      <div className="profile-image-container">
        <h2>Update Your Profile</h2>
        <div className="image-preview">
          {previewImage ? (
            <motion.img
              key={previewImage}
              src={previewImage}
              alt="Profile preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <motion.div
              className="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              No image selected
            </motion.div>
          )}
        </div>
        {isUploading && (
          <motion.div
            className="upload-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Uploading profile image...
          </motion.div>
        )}
        <div className="file-input-container">
          <label htmlFor="profile-image" className="custom-file-input">
            {profileImage ? profileImage.name : "Choose a file"}
          </label>
          <input
            type="file"
            id="profile-image"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </div>
      </div>

      <div className="profile-form-container">
        {error && (
          <motion.div
            className="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            className="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {successMessage}
          </motion.div>
        )}
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

          <motion.button
            type="submit"
            className="button-user-page"
            disabled={isSubmitting}
            initial={{ scale: 1 }}
            animate={isSubmitting ? { scale: 1.05 } : {}}
            transition={{
              duration: 0.5,
              repeat: isSubmitting ? Infinity : 0,
              repeatType: "reverse",
            }}
          >
            {isSubmitting ? "Updating profile..." : "Save Changes"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default UserPage;
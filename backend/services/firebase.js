import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "...",
  projectId: "...",
  // ... paste your actual config here
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// HELPER FUNCTION: To save a pollution spike
export const saveSpike = async (spikeData) => {
  try {
    await addDoc(collection(db, "spikes"), spikeData);
    console.log("Spike saved to Ernakulam DB!");
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
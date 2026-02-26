import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Configuration for Esqueleto app (from c:\Users\Jose\Desktop\Esqueleto\src\firebase.js)
const esqueletoConfig = {
    projectId: "esqueleto-gym",
    appId: "1:53330207641:web:9e6a8d88b31f81e3c0a908",
    storageBucket: "esqueleto-gym.firebasestorage.app",
    apiKey: "AIzaSyCRv_o6cD7xpjzeVhOLCzd_lybjA4dv81I",
    authDomain: "esqueleto-gym.firebaseapp.com",
    messagingSenderId: "53330207641"
};

// Initialize second firebase instance
let esqueletoApp;
if (!getApps().find(app => app.name === 'esqueleto')) {
    esqueletoApp = initializeApp(esqueletoConfig, 'esqueleto');
} else {
    esqueletoApp = getApp('esqueleto');
}

const db = getFirestore(esqueletoApp);

/**
 * Fetches the most recent weights for a list of exercise names from the Esqueleto history.
 */
export const getRecentWeights = async (exerciseNames) => {
    try {
        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => doc.data());

        const results = {};
        
        for (const name of exerciseNames) {
            // Find most recent match
            const match = history.find(workout => 
                workout.exercises && workout.exercises.find(ex => 
                    (ex.name || ex.exercise || '').toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes((ex.name || ex.exercise || '').toLowerCase())
                )
            );

            if (match) {
                const exMatch = match.exercises.find(ex => 
                    (ex.name || ex.exercise || '').toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes((ex.name || ex.exercise || '').toLowerCase())
                );
                
                results[name] = {
                    load: exMatch.load || (exMatch.weight_kg ? `${exMatch.weight_kg} kg` : (exMatch.weight ? `${exMatch.weight} kg` : '0 kg')),
                    rir: exMatch.RIR || exMatch.rir || ''
                };
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error fetching recent weights:', error);
        return {};
    }
};

/**
 * Sends a workout to the Esqueleto "Today" tab (activeWorkout)
 */
export const sendToEsqueleto = async (workout) => {
    try {
        const docRef = doc(db, 'appState', 'activeWorkout');
        
        // Format workout for Esqueleto's TodayView
        const activeWorkout = {
            ...workout,
            id: `v_${Date.now()}`,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp(),
            // Ensure properties match Esqueleto's expectations
            session: workout.title,
            date: workout.date || new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
            exercises: workout.exercises.map(ex => ({
                exercise: ex.name,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                load: ex.load || '0 kg',
                RIR: ex.rir || '',
                notes: ex.notes || ''
            }))
        };

        await setDoc(docRef, {
            workout: activeWorkout,
            timestamp: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Error sending to Esqueleto:', error);
        return false;
    }
};

(function (window) {
    const firebaseConfig = { apiKey: "AIzaSyAP8f9ldzgyKAg74Da2yYL9u_urRLtf8nY", authDomain: "crm-financiero.firebaseapp.com", projectId: "crm-financiero", storageBucket: "crm-financiero.firebasestorage.app", messagingSenderId: "442754442943", appId: "1:442754442943:web:914d5a8ef619d77407880a", measurementId: "G-5EBSSNG8P9" };

    if (!window.firebase) {
        throw new Error('Firebase SDK no está disponible antes de cargar firebase-service.js');
    }

    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);

    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    let authReadyPromise = null;

    async function getCurrentUserUid() {
        if (auth.currentUser?.uid) return auth.currentUser.uid;
        if (!authReadyPromise) {
            authReadyPromise = new Promise((resolve, reject) => {
                const unsubscribe = auth.onAuthStateChanged(async (user) => {
                    if (user?.uid) {
                        unsubscribe();
                        resolve(user.uid);
                        return;
                    }
                    try {
                        const credential = await auth.signInAnonymously();
                        unsubscribe();
                        resolve(credential.user.uid);
                    } catch (error) {
                        unsubscribe();
                        reject(error);
                    }
                }, (error) => {
                    unsubscribe();
                    reject(error);
                });
            });
        }
        return authReadyPromise;
    }

    async function getUserCardsCollection() {
        await getCurrentUserUid();
        return db.collection('cards'); // IMPORTANTE: conservar colección actual para compatibilidad de datos.
    }

    async function getUserTransactionsCollection() {
        await getCurrentUserUid();
        return db.collection('transactions'); // IMPORTANTE: conservar colección actual para compatibilidad de datos.
    }

    async function runFirestoreHealthCheck() {
        try {
            const cardsRef = await getUserCardsCollection();
            await cardsRef.limit(1).get();
            window.updateSyncIndicator?.();
            return true;
        } catch (error) {
            console.error('Firestore health check failed:', error);
            window.updateSyncIndicator?.('offline');
            return false;
        }
    }

    const FirebaseService = {
        firebaseConfig,
        auth,
        db,
        getCurrentUserUid,
        getUserCardsCollection,
        getUserTransactionsCollection,
        runFirestoreHealthCheck
    };

    // IMPORTANTE: API global temporal para no romper funciones legacy que aún viven en index.html.
    window.FirebaseService = FirebaseService;
    // IMPORTANTE: aliases globales temporales mientras index.html termina de migrar a módulos de datos.
    window.firebaseConfig = firebaseConfig;
    window.auth = auth;
    window.db = db;
    window.getCurrentUserUid = getCurrentUserUid;
    window.getUserCardsCollection = getUserCardsCollection;
    window.getUserTransactionsCollection = getUserTransactionsCollection;
    window.runFirestoreHealthCheck = runFirestoreHealthCheck;
})(window);

/**
 * Helper para obtener la instancia de Firestore de manera consistente
 */
export function getFirestoreInstance(firebaseService: any) {
    return firebaseService.getFirestore();
}

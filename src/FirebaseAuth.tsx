import React, { useEffect, useState } from 'react'
import { firebase, FirebaseContext } from "./Firebase"

// Firebase認証状態を取得するカスタムフック
const useFirebaseAuth = () => {
    const [initialized, setInitialized] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState('')
    useEffect(() => {
        firebase.auth().onAuthStateChanged(async user => {
            setInitialized(true);
            setUserId(user ? user.uid : null);
            setUserName(user ? user.displayName || '' : '');
        });
    }, []);
    return {initialized, userId, userName}
}

interface FirebaseAuthProps {
    NotSignedIn: React.FC;
    Loading: React.FC;
}

export const FirebaseAuth: React.FC<FirebaseAuthProps> = ({
    children,
    NotSignedIn,
    Loading
}) => {
    const { initialized, userId, userName } = useFirebaseAuth();
    if (!initialized) {
        // 状態取得が完了していない段階で表示する
        return <Loading />;
    } else if (!userId) {
        // サインインが必須な時にサインインを促す
        return <NotSignedIn />;
    } else {
        return (
            <FirebaseContext.Provider
                value={{ userId, userName }}
                children={children}
            />
        );
    }
};

// redirect to sign in page
export const signInWithRedirect = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithRedirect(provider);
}

// sign out
export const signOut = () => {
    return firebase.auth().signOut();
}

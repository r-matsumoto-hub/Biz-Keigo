import {
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback,
    useRef
} from 'react'
import { database } from 'firebase'

import { firebase, FirebaseContext } from './Firebase'

export interface Document {
    textId: string;
    title: string;
    text: string;
}

// userIDとpathからデータを参照する
const useDocRef = (pathname: string): database.Reference => {
    const { userId } = useContext(FirebaseContext);
    const ref = useMemo(() => {
        return firebase.database().ref(`users/${userId}/${pathname}`);
    }, [userId, pathname]);
    return ref;
};

// refを参照してドキュメントを取得する
function useFetchDocument<T>(ref: database.Reference) {
    const [document, setDocument] = useState<T>();
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        let mounted = true;
        ref.on('value', snapshot => {
            if (!mounted) {
                return;
            }
            if (snapshot && snapshot.val()) {
                setDocument(snapshot.val());
            }
            setLoaded(true);
        });
        return () => {
            ref.off();
            mounted = false;
        };
    }, [ref]);
    return { document, loaded }
}

// userIdユーザーの全てのドキュメント取得
export const useAllDocuments = () => {
    const ref = useDocRef('documents');
    return useFetchDocument<{ [key: string]: Document }>(ref);
}

// ドキュメントの内容の更新
function useUpdateDocument<T = any>(ref: database.Reference) {
    const [pending, setPending] = useState(false);
    const timerRef = useRef<any>(undefined);
    const mountedRef = useRef<boolean>(false);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        }
    }, []);
    const updateDocument = useCallback(
        (document: T) => {  
            if (timerRef.current !== undefined) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                if (!mountedRef.current) {
                    return;
                }
                setPending(true);
                ref.set(document).then(() => {
                    setPending(false);
                });
                timerRef.current = undefined;
            }, 500)
        }, [ref]
    )
    return { pending, updateDocument };
}

// userIDユーザーのtextIDのドキュメントの取得
export const useDatabaseDocument = (textId: string) => {
    const ref = useDocRef(`documents/${textId}`);
    const { document, loaded } = useFetchDocument(ref);
    const [text, setText] = useState('');
    const { pending, updateDocument } = useUpdateDocument(ref);
    useEffect(() => {
        let mounted = true;
        if (mounted && document && "text" in document) {
            setText(document.text);
        }
        return () => {
            mounted = false;
        };
    }, [document]);
    const updateText = useCallback(
        (newText: string) => {
            setText(newText);
            console.log(`newText: ${newText}`)
            const title = newText.split("\n")[0];
            updateDocument({
                textId,
                text: newText,
                title,
                updateAt: new Date()
            });
        }, [updateDocument, textId]
    );
    console.log(text)
    return { text, updateText, loaded, pending };
};

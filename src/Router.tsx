import React, {
    useState,
    useEffect,
    useMemo,
    useContext,
    useCallback
} from 'react';
import {History} from 'history';
import {isUuid} from 'uuidv4';
import Index from './pages/Index'
import Edit from './pages/Edit'

const RouterContext = React.createContext<History | null>(null);

// URLの変更を検知してstate更新するカスタムフック
const useCurrentPath = (history: History) => {
    const [pathname, setPathname] = useState(history.location.pathname);
    useEffect(() => {
        const unlisten = history.listen(location => {
            setPathname(location.pathname);
        });
        return unlisten;
    }, [history]);
    return pathname;
};

// 各ページへのルーティング用カスタムフック
const useEditorRouting = (pathname: string) => {
    const context = useMemo(() => {
        if (pathname === '/') {
            return <Index />
        } else if (isUuid(pathname.slice(1))) {
            return <Edit textId={pathname.slice(1)} />
        } else {
            return <>404 not found...</>
        }
    }, [pathname])
    return context;
}

// ルーティングコンポーネント
type RouterProps = {history: History}
export const Router: React.FC<RouterProps> = ({history}) => {
    const pathname = useCurrentPath(history);
    const content = useEditorRouting(pathname);
    return (
        <RouterContext.Provider value={history}>
            {content}
        </RouterContext.Provider>
    );
}

// 画面遷移のリンク用コンポーネント
type LinkProps = {href: string, as?: string};
export const Link: React.FC<LinkProps> = ({href, as = 'a', children}) => {
    const history = useContext(RouterContext);
    const onClick = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            event.preventDefault();
            history!.push(href);
        },
    [history, href]);
    return React.createElement(as, {onClick, href}, children);
}

import { createContext, useState } from "react";

export const UserContext = createContext();

const UserProvider = ({ children }) => {

    const [user, setUser] = useState(false);
    const [authModal, setAuthModal] = useState(null);

    return (
        <UserContext.Provider value={{ user, setUser, authModal, setAuthModal }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Navigate } from "react-router-dom";

const ProtectedComponents = ({ children }) => {

    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    const checkAuth = async () => {
        try {

            const res = await api.get("/auth", {
                withCredentials: true
            });

            if (res?.data?.success) {
                setIsAuth(true);
            }

        } catch (error) {
            console.log(error);
            setIsAuth(false);
        }

        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // ⏳ wait until API finishes
    if (loading) {
        return <div>Loading...</div>;
    }

    // ❌ not authenticated
    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    // ✅ authenticated
    return children;
};

export default ProtectedComponents;